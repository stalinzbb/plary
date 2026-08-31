import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { disconnect } from "@/lib/figma/connections";

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  await disconnect(userId);

  return NextResponse.json({ success: true });
}
