import type { TierConfig, TierKey } from "./tierConfig";
import type { TierItemRow } from "@/hooks/useWaterfall";

interface SubcategoryRow {
  id: string;
  name: string;
  tier: TierKey;
  sortOrder: number;
  isLocked: boolean;
}

interface SubcategorySummary {
  subcategoryId: string;
  name: string;
  total: number;
  items: TierItemRow[];
}

interface Props {
  tier: TierKey;
  config: TierConfig;
  subcategories: SubcategoryRow[];
  subcategoryTotals: Record<string, SubcategorySummary>;
  tierTotal: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  now?: Date;
  stalenessMonths?: number;
}

// Stub — will be replaced in Task 2
export default function SubcategoryList({ subcategories, selectedId, onSelect }: Props) {
  return (
    <div>
      {subcategories.map((sub) => (
        <button
          key={sub.id}
          data-testid={`subcategory-row-${sub.id}`}
          aria-selected={sub.id === selectedId}
          onClick={() => onSelect(sub.id)}
        >
          {sub.name}
        </button>
      ))}
    </div>
  );
}
