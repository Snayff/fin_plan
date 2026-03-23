import type { WealthSummary, AssetClass } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { DefinitionTooltip } from "@/components/common/DefinitionTooltip";
import { cn } from "@/lib/utils";

const CLASS_LABELS: Record<AssetClass, string> = {
  savings: "Savings",
  pensions: "Pensions",
  investments: "Investments",
  property: "Property",
  vehicles: "Vehicles",
  other: "Other",
};

const ASSET_CLASSES: AssetClass[] = [
  "savings",
  "pensions",
  "investments",
  "property",
  "vehicles",
  "other",
];

interface WealthLeftPanelProps {
  summary: WealthSummary;
  accounts: any[];
  onSelectClass: (cls: AssetClass) => void;
  onSelectTrust: (name: string) => void;
  selectedClass: AssetClass | "trust" | null;
  selectedTrustName: string | null;
}

export function WealthLeftPanel({
  summary,
  accounts,
  onSelectClass,
  onSelectTrust,
  selectedClass,
  selectedTrustName,
}: WealthLeftPanelProps) {
  const trustAccounts = accounts.filter((a) => a.isTrust && a.trustBeneficiaryName);

  const trustTotals = trustAccounts.reduce<Record<string, number>>((acc, a) => {
    const name: string = a.trustBeneficiaryName as string;
    acc[name] = (acc[name] ?? 0) + (a.balance ?? 0);
    return acc;
  }, {});

  const trustBeneficiaries = Object.entries(trustTotals);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <DefinitionTooltip term="Net Worth">Net Worth</DefinitionTooltip>
        </p>
        <p className="text-2xl font-bold">{formatCurrency(summary.netWorth)}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {summary.ytdChange >= 0 ? "+" : ""}
          {formatCurrency(summary.ytdChange)} this year
        </p>
      </div>

      {/* By Liquidity */}
      <div className="space-y-1 py-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cash &amp; Savings</span>
          <span>{formatCurrency(summary.byLiquidity.cashAndSavings)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Investments &amp; Pensions</span>
          <span>{formatCurrency(summary.byLiquidity.investmentsAndPensions)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Property &amp; Vehicles</span>
          <span>{formatCurrency(summary.byLiquidity.propertyAndVehicles)}</span>
        </div>
      </div>

      <hr className="my-2" />

      {/* Asset Class Rows */}
      <div className="space-y-0.5">
        {ASSET_CLASSES.map((cls) => {
          if (summary.byClass[cls] === 0) return null;
          const isSelected = selectedClass === cls;
          return (
            <button
              key={cls}
              className={cn(
                "w-full flex justify-between items-center px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent",
                isSelected && "bg-accent"
              )}
              onClick={() => onSelectClass(cls)}
            >
              <span>{CLASS_LABELS[cls]}</span>
              <span className="font-medium">{formatCurrency(summary.byClass[cls])}</span>
            </button>
          );
        })}
      </div>

      {/* Trust Section */}
      {trustBeneficiaries.length > 0 && (
        <>
          <hr className="my-2" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-1">
            <DefinitionTooltip term="Held on Behalf Of">Held on Behalf Of</DefinitionTooltip>
          </p>
          <div className="space-y-0.5">
            {trustBeneficiaries.map(([name, total]) => {
              const isSelected = selectedTrustName === name;
              return (
                <button
                  key={name}
                  className={cn(
                    "w-full flex justify-between items-center px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => onSelectTrust(name)}
                >
                  <span>{name}</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
