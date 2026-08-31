export interface PaginatedResult<T> {
  items: T;
  nextCursor: string | null;
}

export interface Prototype {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  figma_url: string | null;
  figma_file_key: string | null;
  figma_node_id: string | null;
  thumbnail_url: string | null;
  archived: boolean;
  kind: "prototype" | "screen";
  collections: { id: string; name: string; created_at: string }[];
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  design_count: number;
  preview_thumbnails: string[];
}

async function fetchApi(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }

  return res.json();
}

export async function listPrototypes(params?: {
  q?: string;
  archived?: boolean;
  kind?: "prototype" | "screen";
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult<Prototype[]>> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.archived) sp.set("archived", "true");
  if (params?.kind) sp.set("kind", params.kind);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.cursor) sp.set("cursor", params.cursor);

  const qs = sp.toString();
  const res = await fetch(`/api/prototypes${qs ? `?${qs}` : ""}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }

  const items = await res.json();
  const nextCursor = res.headers.get("X-Next-Cursor") ?? null;

  return { items, nextCursor };
}

export function getPrototype(id: string) {
  return fetchApi(`/api/prototypes/${id}`) as Promise<Prototype>;
}

export function createPrototype(data: {
  title: string;
  description?: string;
  figma_url?: string;
  figma_file_key?: string;
  figma_node_id?: string;
  thumbnail_url?: string;
  kind?: "prototype" | "screen";
  collection_ids?: string[];
  collection_names?: string[];
}) {
  return fetchApi("/api/prototypes", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Prototype>;
}

export function updatePrototype(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    figma_url: string;
    thumbnail_url: string;
    kind: "prototype" | "screen";
    collection_ids?: string[];
  }>,
) {
  return fetchApi(`/api/prototypes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Prototype>;
}

export function getThumbnailUploadUrl() {
  return fetchApi("/api/uploads/thumbnail-url", {
    method: "POST",
  }) as Promise<{ signedUrl: string; path: string }>;
}

export function deletePrototype(id: string) {
  return fetchApi(`/api/prototypes/${id}`, {
    method: "DELETE",
  }) as Promise<{ success: boolean }>;
}

export function updateLastViewed(id: string) {
  return fetchApi(`/api/prototypes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ last_viewed_at: new Date().toISOString() }),
  }) as Promise<Prototype>;
}

// Collection CRUD

export function listCollections() {
  return fetchApi("/api/collections") as Promise<Collection[]>;
}

export function createCollection(name: string, description?: string) {
  return fetchApi("/api/collections", {
    method: "POST",
    body: JSON.stringify({ name, description: description || null }),
  }) as Promise<Collection>;
}

export function updateCollection(id: string, name: string) {
  return fetchApi(`/api/collections/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  }) as Promise<Collection>;
}

export function deleteCollection(id: string) {
  return fetchApi(`/api/collections/${id}`, {
    method: "DELETE",
  }) as Promise<{ success: boolean }>;
}

export async function getCollectionDesigns(
  id: string,
  params?: {
    q?: string;
    archived?: boolean;
    kind?: "prototype" | "screen";
    limit?: number;
    cursor?: string;
  },
): Promise<PaginatedResult<Prototype[]>> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.archived) sp.set("archived", "true");
  if (params?.kind) sp.set("kind", params.kind);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.cursor) sp.set("cursor", params.cursor);
  const qs = sp.toString();
  const res = await fetch(`/api/collections/${id}/designs${qs ? `?${qs}` : ""}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }

  const items = await res.json();
  const nextCursor = res.headers.get("X-Next-Cursor") ?? null;

  return { items, nextCursor };
}
