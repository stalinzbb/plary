import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { revokeSession, clearSessionCookies } from "@/lib/api/session";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("plary_session")?.value;

  if (sessionToken) {
    await revokeSession(sessionToken);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No need to forward Supabase cookies on logout
        },
      },
    },
  );

  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[logout] Supabase signOut error (non-fatal):", err);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);

  return response;
}
