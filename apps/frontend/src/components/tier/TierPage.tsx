import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SubcategoryList from "./SubcategoryList";
import ItemArea from "./ItemArea";
import { useSubcategories, useTierItems, type TierItemRow } from "@/hooks/useWaterfall";
import { TIER_CONFIGS, type TierKey } from "./tierConfig";

interface TierPageProps {
  tier: TierKey;
}

interface SubcategorySummary {
  subcategoryId: string;
  name: string;
  total: number;
  items: TierItemRow[];
}

export default function TierPage({ tier }: TierPageProps) {
  const config = TIER_CONFIGS[tier];
  const [searchParams] = useSearchParams();
  const { data: subcategories, isLoading: subsLoading } = useSubcategories(tier);
  const { data: allItems, isLoading: itemsLoading } = useTierItems(tier);

  // Group items by subcategoryId and compute monthly totals
  const subcategoryTotals = useMemo<Record<string, SubcategorySummary>>(() => {
    if (!subcategories || !allItems) return {};
    const nameMap = Object.fromEntries(subcategories.map((s) => [s.id, s.name]));
    const groups: Record<string, SubcategorySummary> = {};
    for (const item of allItems) {
      const sid = item.subcategoryId;
      if (!groups[sid]) {
        groups[sid] = {
          subcategoryId: sid,
          name: nameMap[sid] ?? "",
          total: 0,
          items: [],
        };
      }
      const monthly = item.spendType === "monthly" ? item.amount : Math.round(item.amount / 12);
      groups[sid].total += monthly;
      groups[sid].items.push(item);
    }
    return groups;
  }, [subcategories, allItems]);

  const tierTotal = Object.values(subcategoryTotals).reduce((sum, s) => sum + s.total, 0);

  // Select subcategory: URL param → first in list
  const paramId = searchParams.get("subcategory");
  const defaultId = subcategories?.[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(paramId ?? defaultId);

  // Sync selected to default once subcategories load
  const resolvedSelectedId =
    selectedId && subcategories?.some((s) => s.id === selectedId)
      ? selectedId
      : (subcategories?.[0]?.id ?? null);

  const selectedSubcategory = subcategories?.find((s) => s.id === resolvedSelectedId) ?? null;
  const selectedSummary = resolvedSelectedId
    ? (subcategoryTotals[resolvedSelectedId] ?? null)
    : null;

  return (
    <div data-testid={`tier-page-${tier}`} className="relative min-h-screen">
      {/* Tier ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 20% 20%, var(--color-tier-${tier}-glow, rgba(0,0,0,0.06)) 0%, transparent 70%)`,
        }}
      />
      <SubcategoryList
        tier={tier}
        config={config}
        subcategories={subcategories ?? []}
        subcategoryTotals={subcategoryTotals}
        tierTotal={tierTotal}
        selectedId={resolvedSelectedId}
        onSelect={setSelectedId}
        isLoading={subsLoading}
      />
      <ItemArea
        tier={tier}
        config={config}
        subcategory={selectedSubcategory}
        subcategories={(subcategories ?? []).map((s) => ({ id: s.id, name: s.name }))}
        items={selectedSummary?.items ?? []}
        isLoading={itemsLoading}
      />
    </div>
  );
}
