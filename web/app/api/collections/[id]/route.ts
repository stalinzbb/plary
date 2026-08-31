import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const body = await request.json();
  const normalized = (body.name ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return NextResponse.json({ error: "Collection name is required.", error_code: "validation_error" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: conflict } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", userId)
    .eq("name", normalized)
    .neq("id", id)
    .maybeSingle();

  if (conflict) {
    return NextResponse.json(
      { error: "A collection with this name already exists.", error_code: "collection_name_conflict" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .update({ name: normalized })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "update_collection_error" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "delete_collection_error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
