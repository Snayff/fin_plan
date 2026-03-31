import { useState } from "react";
import type { AccountType } from "@finplan/shared";
import { useAccountsByType } from "../../hooks/useAssets.js";
import { AssetAccountRow } from "./AssetAccountRow.js";
import { AddEditAccountModal } from "./AddEditAccountModal.js";
import { RecordBalanceForm } from "./RecordBalanceForm.js";
import type { AccountItem } from "../../services/assets.service.js";

const TYPE_LABELS: Record<AccountType, string> = {
  Savings: "Savings",
  Pension: "Pension",
  StocksAndShares: "Stocks & Shares",
  Other: "Other",
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
  type: AccountType;
}

export function AccountItemArea({ type }: Props) {
  const { data: items, isLoading, isError, refetch } = useAccountsByType(type);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AccountItem | null>(null);
  const [recordItem, setRecordItem] = useState<AccountItem | null>(null);

  const typeTotal = (items ?? []).reduce((sum, i) => sum + i.currentBalance, 0);
  const label = TYPE_LABELS[type];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-14 bg-[rgba(238,242,255,0.04)] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-[rgba(238,242,255,0.5)] text-sm">
        Failed to load {label} accounts.{" "}
        <button onClick={() => void refetch()} className="text-[#a78bfa] underline cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold text-[rgba(238,242,255,0.92)]">{label}</span>
          <span className="text-[12px] text-[rgba(238,242,255,0.4)]">
            {items?.length ?? 0} {(items?.length ?? 0) === 1 ? "item" : "items"}
          </span>
          <span className="text-[13px] font-mono text-[#8b5cf6]">{formatGBP(typeTotal)}</span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-transparent border border-[rgba(238,242,255,0.2)] rounded-md px-3.5 py-1.5 text-[rgba(238,242,255,0.75)] text-[12px] cursor-pointer hover:border-[rgba(238,242,255,0.4)] transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="border-t border-[#1a1f35]" />

      {/* Items */}
      <div className="px-6 flex-1 overflow-y-auto">
        {items?.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-[rgba(238,242,255,0.4)] text-sm mb-3">No {label} accounts yet</div>
            <button
              onClick={() => setAddOpen(true)}
              className="bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] rounded-md px-4 py-2 text-[#a78bfa] text-sm cursor-pointer"
            >
              + Add {label}
            </button>
          </div>
        ) : (
          items?.map((item) => (
            <AssetAccountRow
              key={item.id}
              item={item}
              stalenessThresholdMonths={3}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onRecordBalance={(i) => setRecordItem(i as AccountItem)}
              onEdit={(i) => setEditItem(i as AccountItem)}
            />
          ))
        )}
      </div>

      {addOpen && <AddEditAccountModal type={type} onClose={() => setAddOpen(false)} />}
      {editItem && (
        <AddEditAccountModal type={type} item={editItem} onClose={() => setEditItem(null)} />
      )}
      {recordItem && (
        <RecordBalanceForm
          itemId={recordItem.id}
          itemKind="account"
          onClose={() => setRecordItem(null)}
        />
      )}
    </div>
  );
}
