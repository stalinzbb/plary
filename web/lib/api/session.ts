import { createServiceClient } from "@/lib/supabase/service";
import { alertFailOpen } from "./alert";
import type { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "plary_session";
const SESSION_MAX_AGE_DAYS = 30;
const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function createSession(
  userId: string,
  request: NextRequest,
  response: NextResponse,
): Promise<string> {
  const supabase = createServiceClient();
  const sessionToken = randomHex(32);
  const userAgent = request.headers.get("user-agent") ?? null;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("user_sessions").insert({
    user_id: userId,
    session_token: sessionToken,
    user_agent: userAgent,
    ip_address: ipAddress,
    expires_at: expiresAt,
  });

  if (error) {
    // Fails open: middleware still lets the user through on Supabase auth alone.
    alertFailOpen("session-create", error.message);
    return "";
  }

  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });

  return sessionToken;
}

export interface SessionData {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  notified_new_login: boolean;
}

export async function validateSession(
  sessionToken: string,
): Promise<{
  valid: boolean;
  session?: SessionData;
  latestSessionCreatedAt?: string | null;
}> {
  const supabase = createServiceClient();

  const { data: session, error } = await supabase
    .from("user_sessions")
    .select("id, user_id, created_at, expires_at, revoked_at, notified_new_login")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return { valid: false };
  }

  if (session.revoked_at) {
    return { valid: false };
  }

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return { valid: false };
  }

  let latestSessionCreatedAt: string | null = null;
  if (!session.notified_new_login) {
    const { data: latest } = await supabase
      .from("user_sessions")
      .select("created_at")
      .eq("user_id", session.user_id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      latestSessionCreatedAt = latest.created_at;
    }
  }

  return {
    valid: true,
    session: {
      id: session.id,
      user_id: session.user_id,
      created_at: session.created_at,
      expires_at: session.expires_at,
      revoked_at: session.revoked_at,
      notified_new_login: session.notified_new_login,
    },
    latestSessionCreatedAt,
  };
}

export async function touchSession(sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("user_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function revokeSession(sessionToken: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("session_token", sessionToken);
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function markNewLoginNotified(
  sessionToken: string,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("user_sessions")
    .update({ notified_new_login: true })
    .eq("session_token", sessionToken);
}
