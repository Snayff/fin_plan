import { useHouseholdMembers } from "../../hooks/useSettings.js";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import type { AssetItem, AccountItem } from "../../services/assets.service.js";

type Item = AssetItem | AccountItem;

interface Props {
  item: Item;
  stalenessThresholdMonths: number;
  onRecordBalance: (item: Item) => void;
  onEdit: (item: Item) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never recorded";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AssetAccountRow({
  item,
  stalenessThresholdMonths,
  onRecordBalance,
  onEdit,
  isExpanded,
  onToggle,
}: Props) {
  const { data: members } = useHouseholdMembers();
  const memberName = item.memberUserId
    ? (members?.find((m) => m.userId === item.memberUserId)?.firstName ?? item.memberUserId)
    : "Household";

  const typeLabel = "type" in item ? item.type : "";

  return (
    <div
      className={`border-b border-[rgba(26,31,53,0.8)] ${isExpanded ? "bg-[rgba(139,92,246,0.04)] border-l-2 border-[#8b5cf6] -mx-6 px-6" : ""}`}
    >
      {/* Collapsed header — always shown */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full flex justify-between items-center py-3.5 bg-transparent border-none cursor-pointer text-left"
      >
        <div>
          <div className="text-sm text-[rgba(238,242,255,0.92)]">{item.name}</div>
          <div className="text-[11px] text-[rgba(238,242,255,0.4)] mt-0.5">
            {typeLabel} · {memberName}
            {item.lastReviewedAt && (
              <span className="ml-2">
                <StalenessIndicator
                  lastReviewedAt={item.lastReviewedAt}
                  thresholdMonths={stalenessThresholdMonths}
                />
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-[rgba(238,242,255,0.92)]">
            {formatGBP(item.currentBalance)}
          </div>
          <div className="text-[11px] text-[rgba(238,242,255,0.4)] mt-0.5">
            {formatDate(item.currentBalanceDate)}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="flex flex-col gap-2.5 pb-3.5">
          {/* Balance history */}
          <div>
            <div className="text-[10px] tracking-[0.08em] uppercase text-[rgba(238,242,255,0.25)] mb-1">
              Balance History
            </div>
            {item.balances.length === 0 ? (
              <div className="text-[12px] italic text-[rgba(238,242,255,0.4)]">
                No balances recorded yet
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {item.balances.map((b) => (
                  <div key={b.id} className="flex justify-between text-[12px]">
                    <span className="text-[rgba(238,242,255,0.65)]">{formatDate(b.date)}</span>
                    <span className="font-mono text-[rgba(238,242,255,0.92)]">
                      {formatGBP(b.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onRecordBalance(item)}
              className="bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] rounded-md px-3.5 py-1.5 text-[#a78bfa] text-[12px] cursor-pointer hover:bg-[rgba(139,92,246,0.2)] transition-colors"
            >
              Record Balance
            </button>
            <button
              onClick={() => onEdit(item)}
              className="bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] rounded-md px-3.5 py-1.5 text-[#a78bfa] text-[12px] cursor-pointer hover:bg-[rgba(139,92,246,0.2)] transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
