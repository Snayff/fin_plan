import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SubcategoryList from "./SubcategoryList";
import ItemArea from "./ItemArea";
import { useSubcategories, useWaterfallSummary } from "@/hooks/useWaterfall";
import { TIER_CONFIGS, type TierKey } from "./tierConfig";

interface TierPageProps {
  tier: TierKey;
}

export default function TierPage({ tier }: TierPageProps) {
  const config = TIER_CONFIGS[tier];
  const [searchParams] = useSearchParams();
  const { data: subcategories, isLoading: subsLoading } = useSubcategories(tier);
  const { data: summary, isLoading: summaryLoading } = useWaterfallSummary();

  const tierSummary = summary?.[tier];
  const subcategoryTotals = Object.fromEntries(
    (tierSummary?.subcategories ?? []).map((s) => [s.subcategoryId, s])
  );

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
  const selectedSummary = resolvedSelectedId ? subcategoryTotals[resolvedSelectedId] : null;

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
        tierTotal={tierSummary?.total ?? 0}
        selectedId={resolvedSelectedId}
        onSelect={setSelectedId}
        isLoading={subsLoading}
      />
      <ItemArea
        tier={tier}
        config={config}
        subcategory={selectedSubcategory}
        subcategories={subcategories ?? []}
        items={selectedSummary?.items ?? []}
        isLoading={summaryLoading}
      />
    </div>
  );
}
