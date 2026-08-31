"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  getCollectionDesigns,
  updateCollection,
  deleteCollection,
  listCollections,
  type Prototype,
} from "@/lib/api/client";
import { PrototypeCard } from "@/components/prototype-card";
import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { SearchField } from "@/components/search-field";
import { DesignGrid } from "@/components/design-grid";
import { PageHeader } from "@/components/page-header";
import { LoadMore } from "@/components/load-more";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [designs, setDesigns] = useState<Prototype[]>([]);
  const [collectionName, setCollectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Manage dialog state
  const [manageOpen, setManageOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDesigns = () => {
    Promise.all([
      getCollectionDesigns(id, { archived: true, limit: 20 }),
      listCollections(),
    ])
      .then(([{ items, nextCursor }, collections]) => {
        setDesigns(items);
        setNextCursor(nextCursor);
        const col = collections.find((c) => c.id === id);
        setCollectionName(col?.name ?? "");
      })
      .finally(() => setLoading(false));
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items, nextCursor: newCursor } = await getCollectionDesigns(id, {
        archived: true,
        limit: 20,
        cursor: nextCursor,
      });
      setDesigns((prev) => [...prev, ...items]);
      setNextCursor(newCursor);
    } catch {
      // keep existing data on error
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [id]);

  const filtered = useMemo(() => {
    return designs.filter((d) => {
      if (query) {
        const q = query.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !(d.description ?? "").toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [designs, query]);

  const openManage = () => {
    setRenameValue(collectionName);
    setDeleteConfirm(false);
    setManageOpen(true);
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;
    setSaving(true);
    await updateCollection(id, renameValue.trim());
    setCollectionName(renameValue.trim());
    setSaving(false);
    setManageOpen(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    await deleteCollection(id);
    router.push("/collections");
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-7 w-40 mb-8" />
        <CardGridSkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/collections"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Collections
        </Link>
        <PageHeader
          className="mt-2"
          title={collectionName}
          subtitle={`${designs.length} ${designs.length === 1 ? "design" : "designs"}`}
          actions={
            <Button variant="outline" size="sm" onClick={openManage}>
              Manage
            </Button>
          }
        />
      </div>

      {/* Search + Tags */}
      {designs.length > 0 && (
        <div className="mb-8 space-y-4">
          <SearchField value={query} onChange={setQuery} className="max-w-xs" />
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={designs.length === 0 ? ImageOff : SearchX}
          title={designs.length === 0 ? "No designs in this collection yet" : "No designs match your filters"}
        />
      ) : (
        <DesignGrid>
          {filtered.map((d) => (
            <PrototypeCard key={d.id} prototype={d} />
          ))}
        </DesignGrid>
      )}

      {nextCursor && filtered.length > 0 && (
        <LoadMore onClick={loadMore} loading={loadingMore} />
      )}

      {/* Manage Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage collection</DialogTitle>
            <DialogDescription>
              Rename or delete this collection. Deleting will not delete the
              designs inside — they&apos;ll become uncategorized.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
                placeholder="Collection name"
              />
              <Button size="sm" onClick={handleRename} disabled={saving}>
                Rename
              </Button>
            </div>

            {deleteConfirm ? (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Confirm delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete collection
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
