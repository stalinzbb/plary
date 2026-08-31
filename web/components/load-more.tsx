import { Button } from "@/components/ui/button";

export function LoadMore({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <div className="mt-6 flex justify-center">
      <Button variant="outline" onClick={onClick} disabled={loading}>
        {loading ? "Loading..." : "Load more"}
      </Button>
    </div>
  );
}
