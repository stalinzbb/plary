import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search designs...",
  className,
}: SearchFieldProps) {
  return (
    <div className={`relative group rounded-full bg-muted transition-colors hover:bg-muted/70 focus-within:bg-muted/70 focus-within:ring-2 focus-within:ring-ring/30 ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 bg-transparent rounded-full border-0 pl-10 shadow-none focus-visible:border-0 focus-visible:ring-0"
      />
    </div>
  );
}
