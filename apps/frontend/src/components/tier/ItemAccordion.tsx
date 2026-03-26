import { isStale, type SpendType } from "./formatAmount";
import type { TierConfig } from "./tierConfig";

interface Item {
  id: string;
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  subcategoryName: string;
  notes: string | null;
  lastReviewedAt: Date;
  sortOrder: number;
}

interface Props {
  item: Item;
  config: TierConfig;
  onEdit: () => void;
  onConfirm: () => void;
  now: Date;
  stalenessMonths?: number;
}

const SPEND_TYPE_LABELS: Record<SpendType, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  one_off: "One-off",
};

function formatReviewDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function ItemAccordion({
  item,
  config: _config,
  onEdit,
  onConfirm,
  now,
  stalenessMonths = 12,
}: Props) {
  const stale = isStale(item.lastReviewedAt, now, stalenessMonths);

  return (
    <div className="border-t border-foreground/5 bg-foreground/[0.03] px-4 py-3 text-sm">
      {/* Detail grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-foreground/50">
        <div>
          <span className="block text-foreground/30 uppercase tracking-wide text-[10px]">
            Reviewed
          </span>
          <span className="text-foreground/60">{formatReviewDate(item.lastReviewedAt)}</span>
        </div>
        <div>
          <span className="block text-foreground/30 uppercase tracking-wide text-[10px]">Type</span>
          <span className="text-foreground/60">{SPEND_TYPE_LABELS[item.spendType]}</span>
        </div>
        <div>
          <span className="block text-foreground/30 uppercase tracking-wide text-[10px]">
            Category
          </span>
          <span className="text-foreground/60">{item.subcategoryName}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-2">
        {item.notes ? (
          <p className="text-xs italic text-foreground/60">{item.notes}</p>
        ) : (
          <p className="text-xs text-foreground/30">No notes</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onEdit}
          className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-foreground/60 hover:bg-foreground/5 transition-colors"
        >
          Edit
        </button>
        {stale && (
          <button
            onClick={onConfirm}
            className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/20 transition-colors"
          >
            Still correct ✓
          </button>
        )}
      </div>
    </div>
  );
}
