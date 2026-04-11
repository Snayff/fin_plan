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
        "flex flex-col items-start gap-0.5 rounded-md border border-surface-border bg-surface px-4 py-2.5 transition-colors",
        "hover:border-page-accent focus-visible:border-page-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-page-accent"
      )}
    >
      {empty ? (
        <span className="text-sm text-text-secondary">Link accounts to anchor your cashflow ▸</span>
      ) : (
        <>
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-heading">
            Starting balance
          </span>
          <span className="flex items-center gap-2">
            <span className="font-numeric text-base text-foreground">
              {formatCurrency(startingBalance)}
            </span>
            <span className="text-xs text-text-tertiary">{linkedCount} linked accounts ▾</span>
          </span>
        </>
      )}
    </button>
  );
}
