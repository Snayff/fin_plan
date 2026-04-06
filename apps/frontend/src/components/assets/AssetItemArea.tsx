import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AssetType } from "@finplan/shared";
import {
  useAssetsByType,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useRecordAssetBalance,
  useConfirmAsset,
} from "../../hooks/useAssets.js";
import { AssetAccountRow } from "./AssetAccountRow.js";
import { AssetForm } from "./AssetForm.js";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";

const TYPE_LABELS: Record<AssetType, string> = {
  Property: "Property",
  Vehicle: "Vehicle",
  Other: "Other",
};

interface Props {
  type: AssetType;
}

export function AssetItemArea({ type }: Props) {
  const { data: items, isLoading, isError, refetch } = useAssetsByType(type);
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const recordBalance = useRecordAssetBalance();
  const confirmAsset = useConfirmAsset();

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
        Failed to load {label} items.{" "}
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
      <div className="px-6 py-4 flex justify-between items-center border-b border-foreground/5">
        <div className="flex items-center gap-3">
          <span className="font-heading text-base font-bold text-foreground">{label}</span>
          <span className="text-xs text-foreground/40">
            {items?.length ?? 0} {(items?.length ?? 0) === 1 ? "item" : "items"}
          </span>
          <span className="font-numeric text-sm text-page-accent">
            {formatCurrency(typeTotal, showPence)}
          </span>
        </div>
        <button
          onClick={() => {
            setIsAddingItem(true);
            setExpandedId(null);
            setEditingId(null);
          }}
          disabled={isAddingItem}
          className="bg-transparent border border-foreground/20 rounded-md px-3.5 py-1.5 text-foreground/75 text-xs cursor-pointer hover:border-foreground/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add
        </button>
      </div>

      {/* Content */}
      <div className="px-6 flex-1 overflow-y-auto">
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
              <AssetForm
                mode="add"
                isSaving={createAsset.isPending}
                onSave={async ({ name, memberUserId, growthRatePct, initialValue }) => {
                  try {
                    await createAsset.mutateAsync({
                      name,
                      type,
                      memberUserId: memberUserId ?? undefined,
                      growthRatePct,
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
            ctaHeading={`Add your first ${label}`}
            ctaText="Track the current value of your assets."
            ctaButtonLabel="+ Add"
            onCtaClick={() => setIsAddingItem(true)}
          />
        )}

        {/* Item list */}
        {items?.map((item) => (
          <AssetAccountRow
            key={item.id}
            item={item}
            itemKind="asset"
            stalenessThresholdMonths={12}
            isExpanded={expandedId === item.id}
            isEditing={editingId === item.id}
            isRecording={recordingId === item.id}
            isSavingEdit={updateAsset.isPending}
            isSavingRecord={recordBalance.isPending}
            isSavingConfirm={confirmAsset.isPending}
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
                await confirmAsset.mutateAsync(item.id);
                setEditingId(null);
              } catch {
                // error handled by mutation onError (toast)
              }
            }}
            onSaveEdit={async ({ name, memberUserId, growthRatePct }) => {
              try {
                await updateAsset.mutateAsync({
                  assetId: item.id,
                  data: { name, memberUserId, growthRatePct },
                });
                setEditingId(null);
              } catch {
                // error handled by mutation onError (toast)
              }
            }}
            onSaveRecord={async ({ value, date, note }) => {
              try {
                await recordBalance.mutateAsync({
                  assetId: item.id,
                  data: { value, date, note },
                });
                setRecordingId(null);
              } catch {
                // error handled by mutation onError (toast)
              }
            }}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          try {
            await deleteAsset.mutateAsync(deletingId!);
            setDeletingId(null);
            setEditingId(null);
            setExpandedId(null);
          } catch {
            // error handled by mutation onError (toast)
          }
        }}
        title={deletingItem ? `Remove ${deletingItem.name}?` : "Remove asset?"}
        message={
          deletingItem
            ? `${deletingItem.name} will be permanently removed.`
            : "This asset will be permanently removed."
        }
        confirmText="Remove"
        variant="danger"
        isLoading={deleteAsset.isPending}
      />
    </div>
  );
}
