import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AccountType } from "@finplan/shared";
import {
  useAccountsByType,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useRecordAccountBalance,
  useConfirmAccount,
} from "../../hooks/useAssets.js";
import { AssetAccountRow } from "./AssetAccountRow.js";
import { AccountForm } from "./AccountForm.js";
import GhostAddButton from "@/components/tier/GhostAddButton";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";

const TYPE_LABELS: Record<AccountType, string> = {
  Current: "Current",
  Savings: "Savings",
  Pension: "Pension",
  StocksAndShares: "Stocks & Shares",
  Other: "Other",
};

interface Props {
  type: AccountType;
  initialIsAdding?: boolean;
}

export function AccountItemArea({ type, initialIsAdding }: Props) {
  const { data: items, isLoading, isError, refetch } = useAccountsByType(type);
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  const [isAddingItem, setIsAddingItem] = useState(initialIsAdding ?? false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const recordBalance = useRecordAccountBalance();
  const confirmAccount = useConfirmAccount();

  const typeTotal = (items ?? []).reduce((sum, i) => sum + i.currentBalance, 0);
  const label = TYPE_LABELS[type];
  const deletingItem = items?.find((i) => i.id === deletingId);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-14 bg-foreground/[0.04] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-text-muted text-sm">
        Failed to load {label} accounts.{" "}
        <button
          onClick={() => void refetch()}
          className="text-page-accent underline cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-base font-bold text-foreground">{label}</h2>
          <span className="text-xs text-foreground/40">
            {items?.length ?? 0} {(items?.length ?? 0) === 1 ? "item" : "items"}
          </span>
          <span className="font-numeric text-sm text-page-accent">
            {formatCurrency(typeTotal, showPence)}
          </span>
        </div>
        <GhostAddButton
          onClick={() => {
            setIsAddingItem(true);
            setExpandedId(null);
            setEditingId(null);
          }}
          disabled={isAddingItem}
        />
      </div>

      {/* Content */}
      <div className="px-6 flex-1 min-h-0 overflow-y-auto">
        {/* Add form at top */}
        <AnimatePresence initial={false}>
          {isAddingItem && (
            <motion.div
              key="add-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
              }}
              style={{ overflow: "hidden" }}
            >
              <AccountForm
                mode="add"
                type={type}
                isSaving={createAccount.isPending}
                onSave={async ({ name, memberId, growthRatePct, initialValue }) => {
                  try {
                    await createAccount.mutateAsync({
                      name,
                      type,
                      memberId: memberId ?? undefined,
                      growthRatePct: growthRatePct ?? undefined,
                      initialValue,
                    });
                    setIsAddingItem(false);
                  } catch {
                    // error handled by mutation onError (toast)
                  }
                }}
                onCancel={() => setIsAddingItem(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {items?.length === 0 && !isAddingItem && (
          <GhostedListEmpty
            ctaHeading={`Add your first ${label} account`}
            ctaText="Track the current value of your accounts."
            ctaButtonLabel="+ Add"
            onCtaClick={() => setIsAddingItem(true)}
          />
        )}

        {/* Item list */}
        {items?.map((item) => (
          <div key={item.id} data-search-focus={item.id}>
            <AssetAccountRow
              item={item}
              itemKind="account"
              stalenessThresholdMonths={3}
              isExpanded={expandedId === item.id}
              isEditing={editingId === item.id}
              isRecording={recordingId === item.id}
              isSavingEdit={updateAccount.isPending}
              isSavingRecord={recordBalance.isPending}
              isSavingConfirm={confirmAccount.isPending}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onStartEdit={() => {
                setEditingId(item.id);
                setExpandedId(item.id);
                setRecordingId(null);
              }}
              onStartRecord={() => {
                setRecordingId(item.id);
                setExpandedId(item.id);
              }}
              onCancelEdit={() => setEditingId(null)}
              onCancelRecord={() => setRecordingId(null)}
              onDeleteRequest={() => setDeletingId(item.id)}
              onConfirm={async () => {
                try {
                  await confirmAccount.mutateAsync(item.id);
                  setEditingId(null);
                } catch {
                  // error handled by mutation onError (toast)
                }
              }}
              onSaveEdit={async ({ name, memberId, growthRatePct }) => {
                try {
                  await updateAccount.mutateAsync({
                    accountId: item.id,
                    data: { name, memberId, growthRatePct: growthRatePct ?? null },
                  });
                  setEditingId(null);
                } catch {
                  // error handled by mutation onError (toast)
                }
              }}
              onSaveRecord={async ({ value, date, note }) => {
                try {
                  await recordBalance.mutateAsync({
                    accountId: item.id,
                    data: { value, date, note },
                  });
                  setRecordingId(null);
                } catch {
                  // error handled by mutation onError (toast)
                }
              }}
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          try {
            await deleteAccount.mutateAsync(deletingId!);
            setDeletingId(null);
            setEditingId(null);
            setExpandedId(null);
          } catch {
            // error handled by mutation onError (toast)
          }
        }}
        title={deletingItem ? `Remove ${deletingItem.name}?` : "Remove account?"}
        message={
          deletingItem
            ? `${deletingItem.name} will be permanently removed.`
            : "This account will be permanently removed."
        }
        confirmText="Remove"
        variant="danger"
        isLoading={deleteAccount.isPending}
      />
    </div>
  );
}
