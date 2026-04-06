import { AnimatePresence, motion } from "framer-motion";
import { useHouseholdMembers } from "../../hooks/useSettings.js";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/utils/format";
import { isStale, monthsElapsed } from "@/utils/staleness";
import type { AssetItem, AccountItem } from "../../services/assets.service.js";
import type { AccountType } from "@finplan/shared";
import { AssetForm } from "./AssetForm.js";
import { AccountForm } from "./AccountForm.js";
import { RecordBalanceInlineForm } from "./RecordBalanceInlineForm.js";

type Item = AssetItem | AccountItem;

interface BaseProps {
  item: Item;
  itemKind: "asset" | "account";
  stalenessThresholdMonths: number;
  isExpanded: boolean;
  isEditing: boolean;
  isRecording: boolean;
  isSavingEdit: boolean;
  isSavingRecord: boolean;
  isSavingConfirm: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onStartRecord: () => void;
  onCancelEdit: () => void;
  onCancelRecord: () => void;
  onDeleteRequest: () => void;
  onConfirm: () => void;
  onSaveEdit: (data: {
    name: string;
    memberUserId: string | null;
    growthRatePct?: number | null;
  }) => void;
  onSaveRecord: (data: { value: number; date: string; note: string | null }) => void;
}

const rowVariants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] as number[] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] as number[] },
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never recorded";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatReviewDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function AssetAccountRow({
  item,
  itemKind,
  stalenessThresholdMonths,
  isExpanded,
  isEditing,
  isRecording,
  isSavingEdit,
  isSavingRecord,
  isSavingConfirm,
  onToggle,
  onStartEdit,
  onStartRecord,
  onCancelEdit,
  onCancelRecord,
  onDeleteRequest,
  onConfirm,
  onSaveEdit,
  onSaveRecord,
}: BaseProps) {
  const { data: members } = useHouseholdMembers();
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  const memberName = item.memberUserId
    ? (members?.find((m) => m.userId === item.memberUserId)?.firstName ?? item.memberUserId)
    : "Household";

  const typeLabel = "type" in item ? item.type : "";

  const stale =
    item.lastReviewedAt != null ? isStale(item.lastReviewedAt, stalenessThresholdMonths) : false;
  const monthsAgo = stale && item.lastReviewedAt ? monthsElapsed(item.lastReviewedAt) : 0;

  return (
    <div
      className={`border-b border-foreground/5 ${isExpanded || isEditing ? "bg-page-accent/[0.04] border-l-2 border-page-accent -mx-6 px-6" : ""}`}
    >
      {/* Collapsed header — always shown */}
      <button
        onClick={() => {
          if (isEditing) return;
          onToggle();
        }}
        aria-expanded={isExpanded || isEditing}
        className="w-full flex items-center gap-2 py-3 text-left bg-transparent border-none cursor-pointer"
      >
        {/* Stale dot — fixed-width left column */}
        <span className="w-2 shrink-0 flex items-center justify-center">
          {stale && <span className="h-1.5 w-1.5 rounded-full bg-attention shrink-0" aria-hidden />}
        </span>

        {/* Left: name + metadata */}
        <span className="flex-1 flex flex-col gap-px">
          <span className="text-sm text-text-secondary">{item.name}</span>
          <span className="text-[11px] text-text-tertiary">
            {typeLabel} · {memberName}
          </span>
        </span>

        {/* Right: balance + date */}
        <span className="flex flex-col items-end gap-px">
          <span className="text-sm font-numeric text-text-secondary">
            {formatCurrency(item.currentBalance, showPence)}
          </span>
          <span className="text-[11px] text-text-tertiary">
            {formatDate(item.currentBalanceDate)}
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {/* Edit form — replaces accordion */}
        {isEditing && (
          <motion.div
            key="edit-form"
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ overflow: "hidden" }}
          >
            {itemKind === "asset" ? (
              <AssetForm
                mode="edit"
                initialName={item.name}
                initialMemberUserId={item.memberUserId ?? null}
                initialGrowthRatePct={(item as AssetItem).growthRatePct ?? null}
                isSaving={isSavingEdit}
                isSavingConfirm={isSavingConfirm}
                isStale={stale}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                onDeleteRequest={onDeleteRequest}
                onConfirm={onConfirm}
              />
            ) : (
              <AccountForm
                mode="edit"
                type={(item as AccountItem).type as AccountType}
                initialName={item.name}
                initialMemberUserId={item.memberUserId ?? null}
                initialGrowthRatePct={(item as AccountItem).growthRatePct ?? null}
                isSaving={isSavingEdit}
                isSavingConfirm={isSavingConfirm}
                isStale={stale}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                onDeleteRequest={onDeleteRequest}
                onConfirm={onConfirm}
              />
            )}
          </motion.div>
        )}

        {/* Accordion detail — shown when expanded but not editing */}
        {isExpanded && !isEditing && (
          <motion.div
            key="accordion"
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ overflow: "hidden" }}
          >
            <div
              className={[
                "border-t border-foreground/5 bg-foreground/[0.02] py-2.5 pr-4",
                "border-l-2 border-page-accent/40 pl-[30px]",
              ].join(" ")}
            >
              <div className="flex flex-col gap-2.5">
                {/* Balance history */}
                <div>
                  <span className="block text-text-muted uppercase tracking-[0.07em] text-[10px] mb-1">
                    Balance History
                  </span>
                  {item.balances.length === 0 ? (
                    <p className="text-xs italic text-text-muted">No balances recorded yet</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {item.balances.map((b) => (
                        <div key={b.id} className="flex justify-between text-xs">
                          <span className="text-text-tertiary">{formatDate(b.date)}</span>
                          <span className="font-numeric text-text-secondary">
                            {formatCurrency(b.value, showPence)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Last reviewed — only when stale */}
                {stale && item.lastReviewedAt && (
                  <div>
                    <span className="block text-text-muted uppercase tracking-[0.07em] text-[10px]">
                      Last Reviewed
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-attention">
                      <span
                        className="h-[5px] w-[5px] rounded-full bg-attention shrink-0"
                        aria-hidden
                      />
                      {formatReviewDate(item.lastReviewedAt)} · {monthsAgo} months ago
                    </span>
                  </div>
                )}

                {/* Record balance form or actions */}
                {isRecording ? (
                  <RecordBalanceInlineForm
                    isSaving={isSavingRecord}
                    onSave={onSaveRecord}
                    onCancel={onCancelRecord}
                  />
                ) : (
                  <div className="flex justify-end gap-2 pb-1">
                    <button
                      onClick={onStartRecord}
                      className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-text-tertiary hover:bg-foreground/5 transition-colors"
                    >
                      Record Balance
                    </button>
                    <button
                      onClick={onStartEdit}
                      className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-text-tertiary hover:bg-foreground/5 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
