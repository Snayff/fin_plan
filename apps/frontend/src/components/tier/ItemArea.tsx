import { useState } from "react";
import GhostAddButton from "./GhostAddButton";
import ItemAreaRow from "./ItemAreaRow";
import ItemForm from "./ItemForm";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import { getEmptyStateCopy } from "./emptyStateCopy";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCreateItem, useDeleteItem, type TierItemRow } from "@/hooks/useWaterfall";
import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import type { TierConfig, TierKey } from "./tierConfig";

interface SubcategoryOption {
  id: string;
  name: string;
}

interface SubcategoryInfo {
  id: string;
  name: string;
  tier: TierKey;
  sortOrder: number;
  isLocked: boolean;
}

interface Props {
  tier: TierKey;
  config: TierConfig;
  subcategory: SubcategoryInfo | null;
  subcategories: SubcategoryOption[];
  items: TierItemRow[];
  isLoading: boolean;
  now?: Date;
  stalenessMonths?: number;
}

export default function ItemArea({
  tier,
  config,
  subcategory,
  subcategories,
  items,
  isLoading,
  now = new Date(),
  stalenessMonths = 12,
}: Props) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const createItem = useCreateItem(tier);
  const deleteItem = useDeleteItem(tier, deletingItemId ?? "");

  // Monthly-equivalent total
  const total = items.reduce((sum, item) => {
    const monthly = item.spendType === "monthly" ? item.amount : Math.round(item.amount / 12);
    return sum + monthly;
  }, 0);

  const deletingItem = items.find((it) => it.id === deletingItemId);

  if (!subcategory) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="h-8 animate-pulse rounded bg-foreground/5 w-1/2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-foreground/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-base font-bold text-foreground">{subcategory.name}</h2>
          <span className="text-xs text-foreground/40">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          <span className={`font-numeric text-sm ${config.textClass}`}>
            {formatCurrency(toGBP(total))}
          </span>
        </div>
        {!subcategory.isLocked && (
          <GhostAddButton
            onClick={() => {
              setIsAddingItem(true);
              setExpandedItemId(null);
              setEditingItemId(null);
            }}
            disabled={isAddingItem}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Add form at top */}
        {isAddingItem && (
          <ItemForm
            mode="add"
            config={config}
            subcategories={subcategories}
            initialSubcategoryId={subcategory.id}
            isSaving={createItem.isPending}
            onSave={async (data) => {
              try {
                await createItem.mutateAsync(data as Record<string, unknown>);
                setIsAddingItem(false);
              } catch {
                // error handled by useCreateItem onError (toast)
              }
            }}
            onCancel={() => setIsAddingItem(false)}
          />
        )}

        {/* Empty state */}
        {items.length === 0 && !isAddingItem && (
          <GhostedListEmpty
            rowCount={0}
            ctaText={getEmptyStateCopy(subcategory.name, tier).body}
            onCtaClick={() => setIsAddingItem(true)}
          />
        )}

        {/* Item list */}
        {items.map((item) => (
          <ItemAreaRow
            key={item.id}
            tier={tier}
            config={config}
            item={item}
            subcategoryName={subcategory.name}
            subcategories={subcategories}
            expandedItemId={expandedItemId}
            editingItemId={editingItemId}
            onToggleExpand={(id) => setExpandedItemId(expandedItemId === id ? null : id)}
            onStartEdit={setEditingItemId}
            onCancelEdit={() => setEditingItemId(null)}
            onDeleteRequest={setDeletingItemId}
            now={now}
            stalenessMonths={stalenessMonths}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deletingItemId}
        onClose={() => setDeletingItemId(null)}
        onConfirm={async () => {
          await deleteItem.mutateAsync();
          setDeletingItemId(null);
          setEditingItemId(null);
          setExpandedItemId(null);
        }}
        title={deletingItem ? `Remove ${deletingItem.name}?` : "Remove item?"}
        message={deletingItem ? `${deletingItem.name} will be permanently removed from your plan.` : "This item will be permanently removed from your plan."}
        confirmText="Remove"
        variant="danger"
        isLoading={deleteItem.isPending}
      />
    </div>
  );
}
