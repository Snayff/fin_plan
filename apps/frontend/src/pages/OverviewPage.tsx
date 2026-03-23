import { useState } from "react";
import type React from "react";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { WaterfallLeftPanel } from "@/components/overview/WaterfallLeftPanel";
import { ItemDetailPanel } from "@/components/overview/ItemDetailPanel";
import { CashflowCalendar } from "@/components/overview/CashflowCalendar";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
}

type RightPanelView =
  | { type: "none" }
  | { type: "item"; item: SelectedItem }
  | { type: "cashflow" };

export default function OverviewPage() {
  const [view, setView] = useState<RightPanelView>({ type: "none" });
  const [year] = useState(() => new Date().getFullYear());
  const { data: summary, isLoading } = useWaterfallSummary();

  const left = isLoading ? (
    <SkeletonLoader variant="left-panel" />
  ) : summary ? (
    <WaterfallLeftPanel
      summary={summary}
      onSelectItem={(item) => setView({ type: "item", item })}
      onOpenCashflowCalendar={() => setView({ type: "cashflow" })}
      selectedItemId={view.type === "item" ? view.item.id : null}
    />
  ) : (
    <div className="p-4 text-muted-foreground text-sm">No waterfall data yet.</div>
  );

  let right: React.ReactNode | null = null;
  if (view.type === "item") {
    right = <ItemDetailPanel item={view.item} onBack={() => setView({ type: "none" })} />;
  } else if (view.type === "cashflow") {
    right = <CashflowCalendar year={year} onBack={() => setView({ type: "none" })} />;
  }

  const snapshotPlaceholder = (
    <div className="h-8 border-b flex items-center px-4 gap-2 text-xs text-muted-foreground">
      <span>Snapshot timeline — coming in Phase 13</span>
      <button
        className="ml-auto text-xs text-primary hover:underline"
        onClick={() => console.log("open review")}
        type="button"
      >
        Review ▸
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {snapshotPlaceholder}
      <div className="flex-1 min-h-0">
        <TwoPanelLayout left={left} right={right} />
      </div>
    </div>
  );
}
