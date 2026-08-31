import { createServiceClient } from "@/lib/supabase/service";

// Best-effort client IP for rate-limit keying. Behind Vercel, the left-most
// x-forwarded-for entry is the original client.
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Returns true if the request is allowed, false if the limit is exceeded.
// Fails open on limiter errors — availability over strictness for abuse control.
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_identifier: identifier,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) {
    console.error("[rate-limit] check error:", error.message);
    return true;
  }
  return data === true;
}
