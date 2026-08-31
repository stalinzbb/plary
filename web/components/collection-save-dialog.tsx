"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  listCollections,
  createCollection,
  updatePrototype,
  type Prototype,
  type Collection,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/search-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototype: Prototype;
  onSaved: (updated: Prototype) => void;
}

export function CollectionSaveDialog({
  open,
  onOpenChange,
  prototype,
  onSaved,
}: CollectionSaveDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saveSearch, setSaveSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [saveSaving, setSaveSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSaveSearch("");
      setCheckedIds(new Set((prototype.collections ?? []).map((c) => c.id)));
      listCollections().then(setCollections).catch(() => {});
    }
  }, [open, prototype.collections]);

  const toggleCollection = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreateAndAdd = useCallback(async () => {
    const name = saveSearch.trim();
    if (!name) return;
    const created = await createCollection(name);
    setCollections((prev) => [...prev, created]);
    setCheckedIds((prev) => new Set([...prev, created.id]));
    setSaveSearch("");
  }, [saveSearch]);

  const handleSave = useCallback(async () => {
    setSaveSaving(true);
    await updatePrototype(prototype.id, { collection_ids: [...checkedIds] });
    const { getPrototype } = await import("@/lib/api/client");
    const fresh = await getPrototype(prototype.id);
    onSaved(fresh);
    setSaveSaving(false);
    onOpenChange(false);
  }, [prototype.id, checkedIds, onSaved, onOpenChange]);

  const filteredCollections = useMemo(() => {
    if (!saveSearch) return collections;
    const q = saveSearch.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, saveSearch]);

  const searchHasExactMatch = collections.some(
    (c) => c.name.toLowerCase() === saveSearch.trim().toLowerCase(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to collections</DialogTitle>
          <DialogDescription>
            Choose which collections this design belongs to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <SearchField
            placeholder="Search collections..."
            value={saveSearch}
            onChange={setSaveSearch}
          />
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {filteredCollections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCollection(c.id)}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-left hover:bg-muted transition-colors"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    checkedIds.has(c.id)
                      ? "bg-primary border-primary"
                      : "border-input",
                  )}
                >
                  {checkedIds.has(c.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </span>
                {c.name}
              </button>
            ))}
            {saveSearch.trim() && !searchHasExactMatch && (
              <button
                type="button"
                onClick={handleCreateAndAdd}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-left text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create &quot;{saveSearch.trim()}&quot;
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveSaving}>
            {saveSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
