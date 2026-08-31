import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  validateSession,
  touchSession,
  getSessionToken,
  createSession,
  clearSessionCookies,
} from "@/lib/api/session";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets so they load without auth redirect
  const isStatic =
    pathname.startsWith("/_next/") ||
    /\.(svg|png|jpg|jpeg|ico|webp|woff2?|ttf|eot)$/.test(pathname);

  if (isStatic) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api");

  if (isApi && request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // ---- Phase 1: Auth check (Supabase) ----

  // Defer cookie application so we can set them on the final response
  const deferredCookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          deferredCookies.push(...cookiesToSet);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthCallback = pathname.startsWith("/auth");
  const isLogin = pathname === "/login";
  const isLanding = pathname === "/";
  const isPlugin = pathname.startsWith("/plugin");
  const isMarketing = ["/privacy", "/pricing", "/changelog"].includes(pathname);

  // Public routes — let them through without session validation
  if (isApi || isAuthCallback || isLogin || isLanding || isPlugin || isMarketing) {
    const requestHeaders = new Headers(request.headers);
    // Strip identity headers a client may have forged — only middleware
    // is allowed to assert x-user-id, and it never does so for /api.
    requestHeaders.delete("x-user-id");
    requestHeaders.set("x-pathname", pathname);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    deferredCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as never);
    });
    if (isApi) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ---- Phase 2: Application session validation ----

  let sessionToken = getSessionToken(request);

  // Auto-create session for authenticated users who lack one
  if (!sessionToken) {
    // Use a temp response for cookie storage during creation
    const tempResp = NextResponse.next();
    const newToken = await createSession(user.id, request, tempResp);
    if (newToken) {
      sessionToken = newToken;
      // Transfer the session cookie to deferred cookies
      const sessionCookie = tempResp.cookies.get("plary_session");
      if (sessionCookie) {
        // Reconstruct with correct options
        deferredCookies.push({
          name: "plary_session",
          value: sessionCookie.value,
          options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
          },
        });
      }
    }
  }

  if (!sessionToken) {
    // Session tracking unavailable — let user through with Supabase auth only
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-user-id", user.id);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    deferredCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as never);
    });
    if (isApi) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  }

  const { valid, session, latestSessionCreatedAt } =
    await validateSession(sessionToken);

  if (!valid) {
    const response = NextResponse.redirect(
      new URL("/login?reason=session_expired", request.url),
    );
    clearSessionCookies(response);
    return response;
  }

  // ---- Phase 3: Build final response with all headers ----

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-user-id", user.id);

  // New login detection
  if (
    session &&
    !session.notified_new_login &&
    latestSessionCreatedAt &&
    new Date(latestSessionCreatedAt) > new Date(session.created_at)
  ) {
    requestHeaders.set("x-new-login-detected", "true");
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply deferred Supabase auth cookies
  deferredCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });

  if (isApi) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Throttled last_seen_at update
  const lastSeenCookie = request.cookies.get("plary_last_seen");
  const now = Date.now();
  if (
    !lastSeenCookie ||
    now - parseInt(lastSeenCookie.value, 10) > TOUCH_INTERVAL_MS
  ) {
    touchSession(session!.id).catch((err) =>
      console.error("[middleware] touchSession error:", err),
    );
    response.cookies.set("plary_last_seen", String(now), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOUCH_INTERVAL_MS / 1000,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
