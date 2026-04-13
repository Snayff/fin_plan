import { useState } from "react";
import { LinkedAccountsButton } from "./LinkedAccountsButton";
import { LinkedAccountsPopover } from "./LinkedAccountsPopover";

interface CashflowHeaderProps {
  startingBalance: number;
  linkedCount: number;
  oldestBalanceDate: string | null;
}

export function CashflowHeader({
  startingBalance,
  linkedCount,
  oldestBalanceDate,
}: CashflowHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
      <h2 className="font-heading text-base font-bold text-foreground">Cashflow</h2>
      <div className="relative">
        <LinkedAccountsButton
          startingBalance={startingBalance}
          linkedCount={linkedCount}
          oldestBalanceDate={oldestBalanceDate}
          isOpen={open}
          onClick={() => setOpen((o) => !o)}
        />
        {open && (
          <div className="absolute right-0 top-full mt-1 z-10">
            <LinkedAccountsPopover onClose={() => setOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
