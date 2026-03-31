import type { AssetType, AccountType } from "@finplan/shared";
import type { AssetsSummary } from "../../services/assets.service.js";

const ASSET_TYPES: AssetType[] = ["Property", "Vehicle", "Other"];
const ACCOUNT_TYPES: AccountType[] = ["Savings", "Pension", "StocksAndShares", "Other"];

const TYPE_LABELS: Record<AssetType | AccountType, string> = {
  Property: "Property",
  Vehicle: "Vehicle",
  Other: "Other",
  Savings: "Savings",
  Pension: "Pension",
  StocksAndShares: "Stocks & Shares",
};

function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  summary: AssetsSummary | undefined;
  selected: AssetType | AccountType;
  onSelect: (type: AssetType | AccountType) => void;
  staleCountByType?: Partial<Record<AssetType | AccountType, number>>;
}

export function AssetsLeftPanel({ summary, selected, onSelect, staleCountByType = {} }: Props) {
  const grandTotal = summary?.grandTotal ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-baseline">
        <div className="text-[#8b5cf6] text-[22px] font-bold tracking-[0.04em] uppercase font-[Outfit]">
          Assets
        </div>
        <div className="text-[#8b5cf6] text-base font-semibold font-mono">
          {formatGBP(grandTotal)}
        </div>
      </div>

      {/* List */}
      <div className="flex-1">
        {/* Assets group */}
        <div className="px-5 py-1.5 text-[rgba(238,242,255,0.25)] text-[10px] tracking-[0.1em] uppercase">
          Assets
        </div>
        {ASSET_TYPES.map((type) => {
          const isSelected = selected === type;
          const total = summary?.assetTotals[type] ?? 0;
          const staleCount = staleCountByType[type] ?? 0;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`w-full flex justify-between items-center px-5 py-2.5 text-left bg-transparent border-none cursor-pointer ${
                isSelected ? "border-l-2 border-[#8b5cf6] pl-[18px]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${isSelected ? "text-[rgba(238,242,255,0.92)] font-semibold" : "text-[rgba(238,242,255,0.65)]"}`}
                >
                  {TYPE_LABELS[type]}
                </span>
                {staleCount > 0 && (
                  <span className="text-[10px] text-amber-400">● {staleCount} stale</span>
                )}
              </div>
              <span
                className={`text-[13px] font-mono ${isSelected ? "text-[#8b5cf6]" : "text-[rgba(238,242,255,0.5)]"}`}
              >
                {formatGBP(total)}
              </span>
            </button>
          );
        })}

        {/* Accounts group */}
        <div className="px-5 pt-3.5 pb-1.5 text-[rgba(238,242,255,0.25)] text-[10px] tracking-[0.1em] uppercase">
          Accounts
        </div>
        {ACCOUNT_TYPES.map((type) => {
          const isSelected = selected === type;
          const total = summary?.accountTotals[type] ?? 0;
          const staleCount = staleCountByType[type] ?? 0;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`w-full flex justify-between items-center px-5 py-2.5 text-left bg-transparent border-none cursor-pointer ${
                isSelected ? "border-l-2 border-[#8b5cf6] pl-[18px]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${isSelected ? "text-[rgba(238,242,255,0.92)] font-semibold" : "text-[rgba(238,242,255,0.65)]"}`}
                >
                  {TYPE_LABELS[type]}
                </span>
                {staleCount > 0 && (
                  <span className="text-[10px] text-amber-400">● {staleCount} stale</span>
                )}
              </div>
              <span
                className={`text-[13px] font-mono ${isSelected ? "text-[#8b5cf6]" : "text-[rgba(238,242,255,0.5)]"}`}
              >
                {formatGBP(total)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1a1f35] px-5 py-3.5 flex justify-between items-center">
        <span className="text-sm text-[rgba(238,242,255,0.65)]">Total</span>
        <span className="text-sm font-mono text-[rgba(238,242,255,0.92)]">
          {formatGBP(grandTotal)}
        </span>
      </div>
    </div>
  );
}
