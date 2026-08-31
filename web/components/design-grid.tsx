import { staggerDelay } from "@/lib/animation";

interface DesignGridProps {
  children: React.ReactNode[];
}

export function DesignGrid({ children }: DesignGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {children.map((child, i) => (
        <div
          key={i}
          className="animate-fade-slide-in"
          style={staggerDelay(i)}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
