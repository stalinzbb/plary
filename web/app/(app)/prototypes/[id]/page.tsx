"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  getPrototype,
  deletePrototype,
  updateLastViewed,
  updatePrototype,
  type Prototype,
} from "@/lib/api/client";
import { buildEmbedUrl } from "@/lib/figma/embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { CollectionSaveDialog } from "@/components/collection-save-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Pencil, Bookmark, ChevronLeft, Eye, FileQuestion } from "lucide-react";

function ViewerSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-7.5rem)]">
      <Skeleton className="flex-1 rounded-2xl m-0 lg:mr-3 min-h-[300px] lg:min-h-0" />
      <div className="w-full lg:w-72 bg-card rounded-2xl border border-border p-6 space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1 pt-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="space-y-2 pt-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function PrototypeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    getPrototype(id)
      .then(setPrototype)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (prototype) {
      updateLastViewed(prototype.id).catch(() => {});
    }
  }, [prototype?.id]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PRESENTED_NODE_CHANGED") {
        console.log("[Plary] Node changed:", event.data);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!prototype) return;
    setDeleting(true);
    try {
      await deletePrototype(prototype.id);
      router.push("/");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [prototype, router]);

  const openEdit = useCallback(() => {
    if (!prototype) return;
    setEditTitle(prototype.title);
    setEditDescription(prototype.description ?? "");
    setEditOpen(true);
  }, [prototype]);

  const handleSaveEdit = async () => {
    if (!prototype) return;
    setEditSaving(true);
    const updated = await updatePrototype(prototype.id, {
      title: editTitle.trim() || prototype.title,
      description: editDescription.trim() || undefined,
    });
    setPrototype({ ...prototype, ...updated, user_email: prototype.user_email });
    setEditSaving(false);
    setEditOpen(false);
  };

  const handleSaved = useCallback((updated: Prototype) => {
    setPrototype(updated);
  }, []);

  if (loading) return <ViewerSkeleton />;

  if (!prototype) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7.5rem)]">
        <EmptyState
          icon={FileQuestion}
          title="Design not found"
          description="This design may have been deleted or the link is invalid."
          action={
            <Link href="/" className="text-sm underline">
              Back to Library
            </Link>
          }
        />
      </div>
    );
  }

  const date = new Date(prototype.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Fall back to a constructed link when the save has no figma_url —
  // common while file-key URL resolution is unavailable
  const figmaLink =
    prototype.figma_url ??
    (prototype.figma_file_key
      ? `https://www.figma.com/${prototype.kind === "prototype" ? "proto" : "design"}/${prototype.figma_file_key}/untitled${
          prototype.figma_node_id
            ? `?node-id=${prototype.figma_node_id.replace(":", "-")}`
            : ""
        }`
      : null);

  const embedUrl = buildEmbedUrl(
    prototype.figma_url,
    prototype.figma_file_key,
    prototype.figma_node_id,
    prototype.kind,
  );

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-7.5rem)] animate-fade-slide-in">
      {/* Preview area */}
      <div className="relative flex-1 bg-muted/50 flex items-center justify-center overflow-hidden rounded-2xl min-h-[300px] lg:min-h-0 lg:mr-4">
        {figmaLink && (
          <a
            href={figmaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Figma
          </a>
        )}
        {embedUrl && !embedError ? (
          <iframe
            src={embedUrl}
            title={prototype.title}
            className="w-full h-full"
            allowFullScreen
            allow="fullscreen"
            onError={() => setEmbedError(true)}
          />
        ) : embedError || embedUrl ? (
          <div className="text-center p-10">
            <p className="text-sm text-muted-foreground mb-3">
              Could not load the prototype embed.
            </p>
            <div className="flex gap-2 justify-center">
              {figmaLink && (
                <Button
                  size="sm"
                  nativeButton={false}
                  render={
                    <a
                      href={figmaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Open in Figma
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setEmbedError(false)}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : prototype.thumbnail_url ? (
          <img
            src={prototype.thumbnail_url}
            alt={prototype.title}
            className="max-h-full max-w-full object-contain p-8"
          />
        ) : (
          <div className="text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No preview available</p>
            {figmaLink && (
              <a
                href={figmaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm underline hover:text-muted-foreground transition-colors"
              >
                Open in Figma
              </a>
            )}
          </div>
        )}
      </div>

      {/* Inspector sidebar */}
      <div className="w-full lg:w-72 flex flex-col shrink-0 overflow-y-auto bg-card rounded-2xl border border-border mt-4 lg:mt-0">
        <div className="p-6">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Library
          </Link>

          {/* Title + kind */}
          <div className="mt-3 flex items-start gap-2">
            <h1 className="text-base font-semibold tracking-tight break-words flex-1">
              {prototype.title}
            </h1>
            <Badge
              variant={prototype.kind === "screen" ? "success" : "info"}
              className="shrink-0"
            >
              {prototype.kind === "screen" ? "Screen" : "Prototype"}
            </Badge>
          </div>

          {prototype.description && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {prototype.description}
            </p>
          )}

          {/* Primary action */}
          {figmaLink && (
            <div className="mt-4">
              <Button
                className="w-full"
                size="sm"
                nativeButton={false}
                render={
                  <a
                    href={figmaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Figma
              </Button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="px-6 pb-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Saved {date}
            {prototype.user_email && (
              <> &middot; {prototype.user_email}</>
            )}
          </p>

          {prototype.last_viewed_at && (
            <p className="text-xs text-muted-foreground/60">
              Last viewed{" "}
              {new Date(prototype.last_viewed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}

          {/* Collections */}
          <div className="pt-1">
            {prototype.collections.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {prototype.collections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/collections/${c.id}`}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/60">No collections</span>
            )}
          </div>
        </div>

        {/* Secondary actions */}
        <div className="px-6 pb-6 mt-auto pt-3 flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit design</DialogTitle>
            <DialogDescription>
              Update the details for this saved design.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between -mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4">
            <Button
              variant="ghost"
              className="text-destructive"
              size="sm"
              onClick={() => {
                setEditOpen(false);
                setDeleteOpen(true);
              }}
            >
              Delete design
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shared Collection Save Dialog */}
      <CollectionSaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        prototype={prototype}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete design</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{prototype.title}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
