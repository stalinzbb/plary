import { Skeleton } from "@/components/ui/skeleton";
import { DesignGrid } from "@/components/design-grid";

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <DesignGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
          <div className="p-2 pt-3 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </DesignGrid>
  );
}
