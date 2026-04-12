import { format } from "date-fns";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

interface LinkedAccountsButtonProps {
  startingBalance: number;
  linkedCount: number;
  oldestBalanceDate: string | null;
  isOpen: boolean;
  onClick: () => void;
}

export function LinkedAccountsButton({
  startingBalance,
  linkedCount,
  oldestBalanceDate,
  isOpen,
  onClick,
}: LinkedAccountsButtonProps) {
  const empty = linkedCount === 0;
  const asOf = oldestBalanceDate ? format(new Date(oldestBalanceDate), "d MMM") : null;

  return (
    <div className="relative group">
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
          <span className="text-xs text-text-secondary">
            Link accounts to anchor your cashflow ▸
          </span>
        ) : (
          <>
            <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-heading">
              Account balances
            </span>
            <span className="font-numeric text-sm text-foreground">
              {formatCurrency(startingBalance)}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {asOf && (
                <>
                  as of {asOf}
                  <span className="mx-1 text-foreground/20">·</span>
                </>
              )}
              {linkedCount} accounts ▾
            </span>
          </>
        )}
      </button>
      {!empty && (
        <div className="pointer-events-none absolute right-0 top-full mt-2 z-20 w-64 rounded-md border border-border bg-card px-3 py-2.5 text-xs text-text-secondary leading-relaxed shadow-lg opacity-0 -translate-y-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0">
          Total across your linked accounts, using each account's most recently recorded balance.
          This value anchors the cashflow forecast.
        </div>
      )}
    </div>
  );
}
