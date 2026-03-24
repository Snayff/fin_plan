import type { IncomeSourceRow } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const ROW_CLASS =
  "flex items-center justify-between py-2 px-3 rounded cursor-pointer hover:bg-accent/50 transition-colors text-[13px] font-body text-text-secondary";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
}

interface IncomeTypePanelProps {
  label: string;
  sources: IncomeSourceRow[];
  onSelectSource: (item: SelectedItem) => void;
  onBack: () => void;
  selectedItemId: string | null;
}

export function IncomeTypePanel({
  label,
  sources,
  onSelectSource,
  onBack,
  selectedItemId,
}: IncomeTypePanelProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← Income
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{label}</span>
      </div>

      {sources.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} sources</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sources.map((src) => {
            const isAnnual = src.frequency === "annual";
            const displayAmount = isAnnual ? src.amount / 12 : src.amount;
            return (
              <div
                key={src.id}
                className={cn(ROW_CLASS, selectedItemId === src.id && "bg-accent")}
                onClick={() =>
                  onSelectSource({
                    id: src.id,
                    type: "income_source",
                    name: src.name,
                    amount: src.amount,
                    lastReviewedAt: new Date(src.lastReviewedAt),
                  })
                }
              >
                <span>{src.name}</span>
                <div className="flex items-center gap-1 font-numeric text-[#cbd5e1]">
                  {isAnnual && <span className="text-xs text-muted-foreground">÷12</span>}
                  <span>{formatCurrency(displayAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
