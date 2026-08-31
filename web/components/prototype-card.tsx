import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Prototype } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { CardTile } from "@/components/card-tile";
import { Bookmark } from "lucide-react";

export function PrototypeCard({
  prototype,
  onSave,
}: {
  prototype: Prototype;
  onSave?: () => void;
}) {
  const router = useRouter();
  const date = new Date(prototype.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/prototypes/${prototype.id}`}
      className="group block relative"
    >
      <CardTile
        mediaClassName="p-8"
        title={prototype.title}
        meta={
          <>
            {date}
            {prototype.collections.length > 0 && (
              <span className="text-muted-foreground/60">
                {" "}&middot;{" "}
                {prototype.collections.slice(0, 2).map((c, i) => (
                  <span key={c.id}>
                    <span
                      className="hover:text-foreground transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        router.push(`/collections/${c.id}`);
                      }}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          e.preventDefault();
                          router.push(`/collections/${c.id}`);
                        }
                      }}
                    >
                      {c.name}
                    </span>
                    {i < Math.min(prototype.collections.length, 2) - 1 && ", "}
                  </span>
                ))}
                {prototype.collections.length > 2 && (
                  <span> +{prototype.collections.length - 2}</span>
                )}
              </span>
            )}
          </>
        }
      >
        <Badge
          variant={prototype.kind === "screen" ? "success" : "info"}
          className="absolute top-4 left-4 transition-opacity group-hover:opacity-80 z-10"
        >
          {prototype.kind === "screen" ? "Screen" : "Prototype"}
        </Badge>
        {onSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSave();
            }}
            className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-background shadow-sm"
            aria-label="Save to collections"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        )}
        {prototype.thumbnail_url ? (
          <img
            src={prototype.thumbnail_url}
            alt={prototype.title}
            className="max-w-full max-h-full object-contain rounded-sm"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-muted-foreground">No preview</span>
        )}
      </CardTile>
    </Link>
  );
}
