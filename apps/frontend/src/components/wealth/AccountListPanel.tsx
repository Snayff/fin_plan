import type { AssetClass, IsaAllowance } from "@finplan/shared";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/format";
import { DefinitionTooltip } from "@/components/common/DefinitionTooltip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import { useSettings } from "@/hooks/useSettings";

import { CLASS_LABELS } from "./assetClassLabels";

interface AccountListPanelProps {
  assetClass: AssetClass | string;
  accounts: any[];
  isaTotals?: IsaAllowance;
  onSelectAccount: (acc: any) => void;
  onBack: () => void;
  selectedAccountId: string | null;
}

export function AccountListPanel({
  assetClass,
  accounts,
  isaTotals,
  onSelectAccount,
  onBack,
  selectedAccountId,
}: AccountListPanelProps) {
  const { data: settings } = useSettings();
  const wealthThreshold = settings?.stalenessThresholds?.wealth_account ?? 3;

  const sorted = [...accounts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isSavings = assetClass === "savings";
  const isaData = isSavings ? (isaTotals ?? null) : null;
  const isaPersons = isaData?.byPerson ?? [];
  const annualLimit = isaData?.annualLimit ?? 20000;

  const heading = CLASS_LABELS[assetClass] ?? assetClass;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← All classes
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{heading}</span>
      </div>

      {/* Add account button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log("add account")}
          className="text-sm"
        >
          + Add account
        </Button>
      </div>

      {/* ISA Allowance */}
      {isSavings && isaPersons.length > 0 && (
        <div className="space-y-3 rounded-lg border p-3">
          {isaPersons.map((person) => {
            const pct = Math.min(100, (person.used / annualLimit) * 100);
            return (
              <div key={person.ownerId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    <DefinitionTooltip term="ISA Allowance">ISA Allowance</DefinitionTooltip>
                    {" — "}
                    {person.name}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(person.used)} used of {formatCurrency(annualLimit)}
                </p>
              </div>
            );
          })}
          {isaData?.taxYearEnd && (
            <p className="text-xs text-muted-foreground">
              Deadline: {format(new Date(isaData.taxYearEnd), "d MMMM yyyy")}
            </p>
          )}
        </div>
      )}

      {/* Account List */}
      <div className="space-y-0.5">
        {sorted.length === 0 && (
          <GhostedListEmpty
            ctaText="Add your savings accounts to track balances and contributions"
            onCtaClick={() => console.log("add account")}
          />
        )}
        {sorted.map((account) => {
          const isSelected = account.id === selectedAccountId;
          return (
            <button
              key={account.id}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors hover:bg-accent text-left",
                isSelected && "bg-accent"
              )}
              onClick={() => onSelectAccount(account)}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{account.name}</p>
                {account.provider && (
                  <p className="text-xs text-muted-foreground truncate">{account.provider}</p>
                )}
                {isSavings && account.interestRate != null && (
                  <p className="text-xs text-muted-foreground">{account.interestRate}% p.a.</p>
                )}
                {account.lastReviewedAt && (
                  <StalenessIndicator
                    lastReviewedAt={account.lastReviewedAt as string}
                    thresholdMonths={wealthThreshold}
                  />
                )}
              </div>
              <span className="font-bold ml-4 shrink-0">
                {formatCurrency(account.balance ?? 0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
