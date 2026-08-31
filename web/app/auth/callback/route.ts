import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSession } from "@/lib/api/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const redirect = searchParams.get("redirect");

  if (errorCode || errorDescription) {
    console.error("[auth/callback] Supabase error:", errorCode, errorDescription);
    return NextResponse.redirect(
      new URL("/login?reason=auth_error", request.url),
    );
  }

  if (!code) {
    if (redirect && redirect.startsWith("/")) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    return NextResponse.redirect(
      new URL("/login?reason=missing_code", request.url),
    );
  }

  const destination = (redirect && redirect.startsWith("/"))
    ? new URL(redirect, request.url)
    : new URL("/", request.url);

  const response = NextResponse.redirect(destination);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Exchange error:", error.message);
    return NextResponse.redirect(
      new URL("/login?reason=exchange_failed", request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[auth/callback] No user after exchange");
    return NextResponse.redirect(
      new URL("/login?reason=exchange_failed", request.url),
    );
  }

  await createSession(user.id, request, response);

  return response;
}
