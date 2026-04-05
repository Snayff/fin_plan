import type { ItemLifecycleState } from "@finplan/shared";

interface Props {
  counts: Record<ItemLifecycleState, number>;
  selected: Set<ItemLifecycleState>;
  onChange: (selected: Set<ItemLifecycleState>) => void;
}

const LABELS: Record<ItemLifecycleState, string> = {
  active: "Active",
  future: "Future",
  expired: "Expired",
};

export default function ItemStatusFilter({ counts, selected, onChange }: Props) {
  function toggle(state: ItemLifecycleState) {
    const next = new Set(selected);
    if (next.has(state)) {
      // Don't allow deselecting all
      if (next.size > 1) next.delete(state);
    } else {
      next.add(state);
    }
    onChange(next);
  }

  return (
    <div className="flex gap-1 rounded-lg bg-surface border border-surface-border p-0.5 w-fit">
      {(["active", "future", "expired"] as const).map((state) => (
        <button
          key={state}
          type="button"
          onClick={() => toggle(state)}
          className={[
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-body font-medium transition-all duration-150",
            selected.has(state)
              ? "bg-surface-elevated border border-surface-elevated-border text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          ].join(" ")}
        >
          {LABELS[state]}
          <span className="font-numeric text-[10px] opacity-50">{counts[state]}</span>
        </button>
      ))}
    </div>
  );
}
