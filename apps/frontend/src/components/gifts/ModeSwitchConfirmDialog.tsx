import type { GiftPlannerMode } from "@finplan/shared";

type Props = {
  fromMode: GiftPlannerMode;
  toMode: GiftPlannerMode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ModeSwitchConfirmDialog({ fromMode, toMode, onConfirm, onCancel }: Props) {
  const isDestructive = fromMode === "synced" && toMode === "independent";
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="w-full max-w-md rounded border border-foreground/10 bg-background p-6">
        <h3 className="mb-3 text-base text-foreground">
          Switch to {toMode === "synced" ? "Synced" : "Independent"} mode?
        </h3>
        {isDestructive ? (
          <div className="space-y-2 text-sm text-foreground/65">
            <p>The following will be deleted:</p>
            <ul className="list-disc pl-5 text-xs text-foreground/50">
              <li>The &quot;Gifts&quot; Discretionary item managed by the planner</li>
              <li>All of its yearly amount-period history</li>
              <li>The lock on the Gifts subcategory (you can add items manually after)</li>
            </ul>
            <p className="text-xs text-foreground/40">
              People, events, allocations, and per-year budgets are preserved.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-foreground/65">
            <p>The following will be created:</p>
            <ul className="list-disc pl-5 text-xs text-foreground/50">
              <li>A planner-owned &quot;Gifts&quot; Discretionary item</li>
              <li>A yearly amount period for the current year using your annual budget</li>
              <li>The Gifts subcategory becomes locked to that single item</li>
            </ul>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1 text-xs text-foreground/65 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-foreground/10 px-3 py-1 text-xs text-foreground hover:bg-foreground/20"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
