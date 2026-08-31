import Link from "next/link";
import type { Collection } from "@/lib/api/client";
import { CardTile } from "@/components/card-tile";

export function CollectionCard({ collection }: { collection: Collection }) {
  const count = collection.design_count;
  const thumbs = collection.preview_thumbnails;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group block"
    >
      <CardTile
        title={collection.name}
        meta={`${count} ${count === 1 ? "design" : "designs"}`}
      >
        {thumbs.length === 0 ? (
          <span className="text-xs text-muted-foreground">No designs yet</span>
        ) : thumbs.length === 1 ? (
          <img
            src={thumbs[0]}
            alt=""
            className="max-w-[75%] max-h-[75%] object-contain rounded-lg shadow-md"
            loading="lazy"
          />
        ) : (
          <div className="relative w-[70%] h-[70%]">
            {/* Bottom card */}
            {thumbs.length >= 3 && (
              <img
                src={thumbs[2]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md border border-border/50 bg-card"
                style={{ transform: "rotate(-5deg) translate(8px, 12px)", zIndex: 0 }}
                loading="lazy"
              />
            )}
            {/* Middle card */}
            {thumbs.length >= 2 && (
              <img
                src={thumbs[1]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md border border-border/50 bg-card"
                style={{
                  transform: `rotate(${thumbs.length >= 3 ? "3deg" : "-3deg"}) translate(${thumbs.length >= 3 ? "-4px" : "4px"}, 6px)`,
                  zIndex: 10,
                }}
                loading="lazy"
              />
            )}
            {/* Top card */}
            <img
              src={thumbs[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md border border-border/50 bg-card"
              style={{ transform: "rotate(2deg)", zIndex: 20 }}
              loading="lazy"
            />
          </div>
        )}
      </CardTile>
    </Link>
  );
}
