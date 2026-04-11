import { useState } from "react";
import { LinkedAccountsButton } from "./LinkedAccountsButton";
import { LinkedAccountsPopover } from "./LinkedAccountsPopover";

interface CashflowHeaderProps {
  startingBalance: number;
  linkedCount: number;
}

export function CashflowHeader({ startingBalance, linkedCount }: CashflowHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-heading text-base uppercase tracking-widest text-page-accent">
        Cashflow
      </h2>
      <div className="relative">
        <LinkedAccountsButton
          startingBalance={startingBalance}
          linkedCount={linkedCount}
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
