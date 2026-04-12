import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

interface LinkedAccountsButtonProps {
  startingBalance: number;
  linkedCount: number;
  isOpen: boolean;
  onClick: () => void;
}

export function LinkedAccountsButton({
  startingBalance,
  linkedCount,
  isOpen,
  onClick,
}: LinkedAccountsButtonProps) {
  const empty = linkedCount === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 transition-colors",
        "hover:border-page-accent focus-visible:border-page-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-page-accent"
      )}
    >
      {empty ? (
        <span className="text-xs text-text-secondary">Link accounts to anchor your cashflow ▸</span>
      ) : (
        <>
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-heading">
            Starting balance
          </span>
          <span className="font-numeric text-sm text-foreground">
            {formatCurrency(startingBalance)}
          </span>
          <span className="text-[11px] text-text-tertiary">{linkedCount} linked accounts ▾</span>
        </>
      )}
    </button>
  );
}
