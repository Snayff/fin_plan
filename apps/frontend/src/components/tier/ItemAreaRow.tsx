import ItemRow from "./ItemRow";
import ItemAccordion from "./ItemAccordion";
import ItemForm from "./ItemForm";
import { useTierUpdateItem, useConfirmWaterfallItem, type TierItemRow } from "@/hooks/useWaterfall";
import type { TierConfig, TierKey } from "./tierConfig";

interface SubcategoryOption {
  id: string;
  name: string;
}

interface Props {
  tier: TierKey;
  config: TierConfig;
  item: TierItemRow;
  subcategoryName: string;
  subcategories: SubcategoryOption[];
  expandedItemId: string | null;
  editingItemId: string | null;
  onToggleExpand: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteRequest: (id: string) => void;
  now: Date;
  stalenessMonths: number;
}

export default function ItemAreaRow({
  tier,
  config,
  item,
  subcategoryName,
  subcategories,
  expandedItemId,
  editingItemId,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onDeleteRequest,
  now,
  stalenessMonths,
}: Props) {
  const isExpanded = expandedItemId === item.id;
  const isEditing = editingItemId === item.id;
  const updateItem = useTierUpdateItem(tier, item.id);
  const confirmItem = useConfirmWaterfallItem(tier, item.id);

  return (
    <ItemRow
      item={item}
      config={config}
      isExpanded={isExpanded}
      onToggle={() => {
        if (isEditing) return;
        onToggleExpand(item.id);
      }}
      now={now}
      stalenessMonths={stalenessMonths}
    >
      {isExpanded && !isEditing && (
        <ItemAccordion
          item={{ ...item, subcategoryName }}
          config={config}
          onEdit={() => onStartEdit(item.id)}
          onConfirm={async () => {
            await confirmItem.mutateAsync();
            onToggleExpand(item.id); // collapse
          }}
          now={now}
          stalenessMonths={stalenessMonths}
        />
      )}
      {isEditing && (
        <ItemForm
          mode="edit"
          item={item}
          config={config}
          subcategories={subcategories}
          initialSubcategoryId={item.subcategoryId}
          isSaving={updateItem.isPending}
          onSave={async (data) => {
            try {
              await updateItem.mutateAsync(data as Record<string, unknown>);
              onCancelEdit();
              onToggleExpand(item.id); // collapse
            } catch {
              // error handled by useUpdateItem onError (toast)
            }
          }}
          onCancel={onCancelEdit}
          onConfirm={async () => {
            try {
              await confirmItem.mutateAsync();
              onCancelEdit();
            } catch {
              // error handled by mutation onError (toast)
            }
          }}
          onDelete={() => onDeleteRequest(item.id)}
        />
      )}
    </ItemRow>
  );
}
