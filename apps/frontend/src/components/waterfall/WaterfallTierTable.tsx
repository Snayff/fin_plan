import { formatCurrency } from "@/utils/format";
import { SubcategoryGroup } from "./SubcategoryGroup";
import { AddSubcategoryButton } from "./AddSubcategoryButton";
import type { TierItemRow } from "@/hooks/useWaterfall";

type Tier = "income" | "committed" | "discretionary";

interface SubcategoryRow {
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
  subcategories: SubcategoryRow[];
  items: TierItemRow[];
  members: Member[];
  total: number;
  onCreateSubcategory: (name: string) => Promise<unknown>;
  onSaveName: (id: string, name: string) => Promise<unknown>;
  onSaveAmount: (id: string, amount: number) => Promise<unknown>;
  onDeleteItem: (id: string) => Promise<unknown>;
}

const TIER_META: Record<Tier, { label: string; colorClass: string }> = {
  income: { label: "INCOME", colorClass: "text-tier-income" },
  committed: { label: "COMMITTED", colorClass: "text-tier-committed" },
  discretionary: {
    label: "DISCRETIONARY",
    colorClass: "text-tier-discretionary",
  },
};

export function WaterfallTierTable({
  tier,
  subcategories,
  items,
  members,
  total,
  onCreateSubcategory,
  onSaveName,
  onSaveAmount,
  onDeleteItem,
}: Props) {
  const meta = TIER_META[tier];
  const isEmpty = items.length === 0 && subcategories.length === 0;

  const orphanItems = items.filter((i) => !subcategories.some((s) => s.id === i.subcategoryId));

  const groupedKnown = subcategories.map((s) => ({
    subcategory: { id: s.id, name: s.name, sortOrder: s.sortOrder },
    items: items.filter((i) => i.subcategoryId === s.id),
  }));

  return (
    <section
      id={tier}
      className="rounded-lg border border-foreground/8 bg-foreground/[0.015]"
      data-testid={`waterfall-tier-${tier}`}
    >
      {/* Tier header */}
      <div className="flex items-baseline justify-between border-b border-foreground/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full bg-tier-${tier}`} />
          <h3
            className={`font-heading text-sm font-bold uppercase tracking-widest ${meta.colorClass}`}
          >
            {meta.label}
          </h3>
        </div>
        <span className="font-numeric tabular-nums text-sm text-text-secondary">
          {formatCurrency(total)}/mo
        </span>
      </div>

      {isEmpty ? (
        <div className="space-y-1.5 p-4">
          {[0.5, 0.25, 0.12].map((op, i) => (
            <div
              key={i}
              data-testid="ghost-skeleton-row"
              className="h-6 rounded bg-foreground/10"
              style={{ opacity: op }}
            />
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-text-tertiary">
            <tr className="border-b border-foreground/5">
              <th className="px-3 py-2 text-left font-heading font-semibold">Name</th>
              {tier === "income" && (
                <th className="px-3 py-2 text-left font-heading font-semibold">Type</th>
              )}
              <th className="px-3 py-2 text-left font-heading font-semibold">Cadence</th>
              {tier === "income" ? (
                <th className="px-3 py-2 text-left font-heading font-semibold">Owner</th>
              ) : (
                <th className="px-3 py-2 text-left font-heading font-semibold">Due</th>
              )}
              <th className="px-3 py-2 text-right font-heading font-semibold">Amount</th>
              <th className="px-3 py-2 text-right font-heading font-semibold">/month</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {groupedKnown.map(({ subcategory, items: groupItems }) => (
              <SubcategoryGroup
                key={subcategory.id}
                tier={tier}
                subcategory={subcategory}
                items={groupItems}
                members={members}
                onAddDraft={() => {}}
                onDeleteItem={onDeleteItem}
                onSaveName={onSaveName}
                onSaveAmount={onSaveAmount}
              />
            ))}
            {orphanItems.length > 0 && (
              <SubcategoryGroup
                tier={tier}
                subcategory={{
                  id: "__uncategorised__",
                  name: "Uncategorised",
                  sortOrder: 999,
                }}
                items={orphanItems}
                members={members}
                onAddDraft={() => {}}
                onDeleteItem={onDeleteItem}
                onSaveName={onSaveName}
                onSaveAmount={onSaveAmount}
              />
            )}
          </tbody>
        </table>
      )}

      <div className="border-t border-foreground/5 px-3 py-2">
        <AddSubcategoryButton onCreate={onCreateSubcategory} />
      </div>
    </section>
  );
}
