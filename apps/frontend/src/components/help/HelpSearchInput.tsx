import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function HelpSearchInput({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        aria-label="Search glossary and concepts"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search…"
        className={cn(
          "w-full rounded-md border bg-card py-1.5 pl-8 pr-7 text-sm outline-none",
          "placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-page-accent/50"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
