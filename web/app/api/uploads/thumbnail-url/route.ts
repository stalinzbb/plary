import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const supabase = createServiceClient();
  const path = `${userId}/${crypto.randomUUID()}.png`;

  const { data, error } = await supabase.storage
    .from("thumbnails")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "upload_error" }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;

  return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl });
}
