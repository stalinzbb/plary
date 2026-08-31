import { cn } from "@/lib/utils";

interface CardTileProps {
  title: string;
  meta: React.ReactNode;
  children: React.ReactNode;
  mediaClassName?: string;
}

/** Shared tile shell for grid cards: media area + label block. Render inside a `group` link. */
export function CardTile({ title, meta, children, mediaClassName }: CardTileProps) {
  return (
    <>
      <div
        className={cn(
          "relative flex w-full aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-inset ring-foreground/5 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] [&_img]:transition-transform [&_img]:duration-300 [&_img]:ease-out group-hover:[&_img]:scale-[1.03]",
          mediaClassName,
        )}
      >
        {children}
      </div>
      <div className="p-1 pt-3 sm:p-2 sm:pt-3">
        <h2 className="line-clamp-1 text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </div>
    </>
  );
}
