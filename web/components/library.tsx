"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  listPrototypes,
  type Prototype,
} from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { PrototypeCard } from "@/components/prototype-card";
import { CollectionSaveDialog } from "@/components/collection-save-dialog";
import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { SearchField } from "@/components/search-field";
import { DesignGrid } from "@/components/design-grid";
import { PageHeader } from "@/components/page-header";
import { LoadMore } from "@/components/load-more";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, SearchX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "date-desc" | "date-asc" | "title-asc" | "title-desc";

const sortLabels: Record<SortKey, string> = {
  "date-desc": "newest",
  "date-asc": "oldest",
  "title-asc": "A-Z",
  "title-desc": "Z-A",
};


export function Library() {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [saveTarget, setSaveTarget] = useState<Prototype | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    listPrototypes({ archived: true, limit: 20 })
      .then(({ items, nextCursor }) => {
        setPrototypes(items);
        setNextCursor(nextCursor);
      })
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    listPrototypes({ archived: true, limit: 20 })
      .then(({ items, nextCursor }) => {
        setPrototypes(items);
        setNextCursor(nextCursor);
      })
      .finally(() => setRefreshing(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items, nextCursor: newCursor } = await listPrototypes({
        archived: true,
        limit: 20,
        cursor: nextCursor,
      });
      setPrototypes((prev) => [...prev, ...items]);
      setNextCursor(newCursor);
    } catch {
      // keep existing data on error
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let result = prototypes.filter((p) => {
      if (query) {
        const q = query.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inDesc = p.description?.toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });

    if (sort) {
      switch (sort) {
        case "date-asc":
          result = [...result].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
          break;
        case "title-asc":
          result = [...result].sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "title-desc":
          result = [...result].sort((a, b) => b.title.localeCompare(a.title));
          break;
        case "date-desc":
          result = [...result].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          break;
      }
    }

    return result;
  }, [prototypes, query, sort]);

  const hasAnyPrototypes = prototypes.length > 0;
  const isFiltering = !!query;

  if (loading) {
    return (
      <div>
        <div className="mb-8 space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-48 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
        <CardGridSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <PageHeader
          title="Library"
          subtitle={`${prototypes.length}${nextCursor ? "+" : ""} saved ${prototypes.length === 1 ? "design" : "designs"}`}
        />
        <div className="flex items-center justify-between gap-3">
          <SearchField value={query} onChange={setQuery} className="flex-1 sm:max-w-xs" />
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
            <Select
              value={sort ?? ""}
              onValueChange={(value) => setSort(value ? value as SortKey : null)}
            >
              <SelectTrigger size="sm" className="bg-muted rounded-full border-0 shadow-none focus-visible:border-0 focus-visible:ring-0">
                <span className={sort ? "" : "text-muted-foreground"}>
                  Sort by{sort ? ` ${sortLabels[sort]}` : ""}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {filtered.length === 0 && !hasAnyPrototypes ? (
        <EmptyState
          icon={Sparkles}
          title="Start your library"
          description="Install the Plary plugin in Figma, select a frame, and save your first design. It'll show up here."
          action={
            <Link href="/settings" className="text-sm underline">
              Go to Settings to get your plugin token
            </Link>
          }
        />
      ) : filtered.length === 0 && isFiltering ? (
        <EmptyState
          icon={SearchX}
          title="No designs match your filters"
          action={
            <Button variant="link" onClick={() => setQuery("")}>
              Clear filter
            </Button>
          }
        />
      ) : (
        <DesignGrid>
          {filtered.map((p) => (
            <PrototypeCard
              key={p.id}
              prototype={p}
              onSave={() => setSaveTarget(p)}
            />
          ))}
        </DesignGrid>
      )}

      {nextCursor && filtered.length > 0 && (
        <LoadMore onClick={loadMore} loading={loadingMore} />
      )}

      {saveTarget && (
        <CollectionSaveDialog
          open={!!saveTarget}
          onOpenChange={(open) => {
            if (!open) setSaveTarget(null);
          }}
          prototype={saveTarget}
          onSaved={(updated) => {
            setPrototypes((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)),
            );
            setSaveTarget(null);
          }}
        />
      )}
    </div>
  );
}
