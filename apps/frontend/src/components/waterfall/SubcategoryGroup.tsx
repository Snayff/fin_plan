import { formatCurrency } from "@/utils/format";
import { TierRow } from "./TierRow";
import type { TierItemRow } from "@/hooks/useWaterfall";

type Tier = "income" | "committed" | "discretionary";

interface Subcategory {
  id: string;
  name: string;
  sortOrder: number;
}

interface Member {
  id: string;
  userId: string;
  firstName: string;
  name: string;
}

interface Props {
  tier: Tier;
  subcategory: Subcategory;
  items: TierItemRow[];
  members: Member[];
  onAddDraft: (subcategoryId: string) => void;
  onDeleteItem: (id: string) => Promise<unknown>;
  onSaveName: (id: string, name: string) => Promise<unknown>;
  onSaveAmount: (id: string, amount: number) => Promise<unknown>;
}

function monthlyTotal(items: TierItemRow[]): number {
  return items.reduce((sum, i) => {
    const m = i.spendType === "monthly" ? i.amount : Math.round(i.amount / 12);
    return sum + m;
  }, 0);
}

export function SubcategoryGroup({
  tier,
  subcategory,
  items,
  members,
  onAddDraft,
  onDeleteItem,
  onSaveName,
  onSaveAmount,
}: Props) {
  const total = monthlyTotal(items);
  const colSpan = tier === "income" ? 7 : 6;

  return (
    <>
      <tr className="bg-foreground/[0.02]">
        <td
          colSpan={colSpan}
          className="px-3 py-2 font-heading text-[10px] uppercase tracking-wider text-text-tertiary"
        >
          <div className="flex items-baseline justify-between">
            <span>{subcategory.name}</span>
            <span className="font-numeric text-xs tabular-nums text-text-secondary">
              {formatCurrency(total)}/mo
            </span>
          </div>
        </td>
      </tr>
      {items.map((item) => (
        <TierRow
          key={item.id}
          tier={tier}
          item={item as any}
          members={members}
          onSaveName={(name) => onSaveName(item.id, name)}
          onSaveAmount={(amount) => onSaveAmount(item.id, amount)}
          onDelete={() => onDeleteItem(item.id)}
        />
      ))}
      <tr>
        <td colSpan={colSpan} className="px-3 py-1.5 text-left">
          <button
            type="button"
            onClick={() => onAddDraft(subcategory.id)}
            className="text-xs italic text-text-tertiary transition-colors hover:text-text-secondary"
          >
            + add
          </button>
        </td>
      </tr>
    </>
  );
}
