import { Search } from "lucide-react";

type Props = { onOpen: () => void };

export function SearchTriggerIcon({ onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Search (Ctrl+K)"
      title="Search (Ctrl+K)"
      className="p-1.5 rounded-sm text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06]"
    >
      <Search className="h-4 w-4" />
    </button>
  );
}
