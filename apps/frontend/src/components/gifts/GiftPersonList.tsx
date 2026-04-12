import type { GiftPersonRow } from "@finplan/shared";

type Props = {
  people: GiftPersonRow[];
  onSelect: (id: string) => void;
};

export function GiftPersonList({ people, onSelect }: Props) {
  if (people.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-foreground/40">
        No people yet — head to Config → Quick Add to start.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-foreground/5">
      {people.map((p) => (
        <li
          key={p.id}
          data-testid={`person-row-${p.id}`}
          onClick={() => onSelect(p.id)}
          className="flex cursor-pointer items-center gap-4 px-6 py-3 transition-colors hover:bg-foreground/5"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">{p.name}</span>
              {p.isHouseholdMember && (
                <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground/50">
                  Household
                </span>
              )}
              {p.hasOverspend && (
                <span
                  data-testid={`overspend-dot-${p.id}`}
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-attention"
                />
              )}
            </div>
            <div className="mt-1 flex gap-3 text-[11px]">
              <span className="text-foreground/40">{p.plannedCount} planned</span>
              <span className="text-foreground/65">{p.boughtCount} bought</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm tabular-nums text-foreground">
              £{p.plannedTotal.toLocaleString()}
            </div>
            <div className="font-mono text-[11px] tabular-nums text-foreground/40">
              £{p.spentTotal.toLocaleString()} spent
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
