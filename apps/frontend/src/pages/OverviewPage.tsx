import { useState } from "react";
import type React from "react";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { WaterfallLeftPanel } from "@/components/overview/WaterfallLeftPanel";
import { ItemDetailPanel } from "@/components/overview/ItemDetailPanel";
import { CashflowCalendar } from "@/components/overview/CashflowCalendar";
import { SnapshotTimeline } from "@/components/overview/SnapshotTimeline";
import { CreateSnapshotModal } from "@/components/overview/CreateSnapshotModal";
import { ReviewWizard } from "@/components/overview/ReviewWizard";
import { useSnapshot } from "@/hooks/useSettings";

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
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewWizard, setShowReviewWizard] = useState(false);

  const { data: liveSummary, isLoading } = useWaterfallSummary();
  const { data: snapshotData } = useSnapshot(selectedSnapshotId);

  const isViewingSnapshot = selectedSnapshotId !== null;
  const summary = isViewingSnapshot && snapshotData?.data ? snapshotData.data : liveSummary;
  const snapshotDate =
    isViewingSnapshot && snapshotData?.createdAt ? new Date(snapshotData.createdAt) : null;

  const left = isLoading ? (
    <SkeletonLoader variant="left-panel" />
  ) : summary ? (
    <WaterfallLeftPanel
      summary={summary as any}
      onSelectItem={(item) => setView({ type: "item", item })}
      onOpenCashflowCalendar={() => setView({ type: "cashflow" })}
      selectedItemId={view.type === "item" ? view.item.id : null}
    />
  ) : (
    <div className="p-4 text-muted-foreground text-sm">No waterfall data yet.</div>
  );

  let right: React.ReactNode | null = null;
  if (view.type === "item") {
    right = (
      <ItemDetailPanel
        item={view.item}
        onBack={() => setView({ type: "none" })}
        snapshotDate={snapshotDate}
      />
    );
  } else if (view.type === "cashflow") {
    right = <CashflowCalendar year={year} onBack={() => setView({ type: "none" })} />;
  }

  return (
    <div className="flex flex-col h-full">
      {isViewingSnapshot ? (
        /* Snapshot mode banner */
        <div className="h-8 border-b flex items-center px-4 gap-2 text-xs bg-amber-50 dark:bg-amber-950/20">
          <span
            className="inline-block h-[5px] w-[5px] rounded-full shrink-0"
            style={{ background: "#f59e0b" }}
          />
          <span className="font-medium" style={{ color: "#f59e0b" }}>
            Viewing: {snapshotData?.name}
          </span>
          <button
            type="button"
            className="ml-auto text-xs hover:underline"
            style={{ color: "#f59e0b" }}
            onClick={() => {
              setSelectedSnapshotId(null);
              setView({ type: "none" });
            }}
          >
            Return to current ▸
          </button>
        </div>
      ) : (
        /* Live timeline */
        <SnapshotTimeline
          selectedId={selectedSnapshotId}
          onSelect={(id) => {
            setSelectedSnapshotId(id);
            setView({ type: "none" });
          }}
          onSelectNow={() => {
            setSelectedSnapshotId(null);
            setView({ type: "none" });
          }}
          onOpenCreate={() => setShowCreateModal(true)}
          onOpenReview={() => setShowReviewWizard(true)}
        />
      )}

      <div className="flex-1 min-h-0">
        <TwoPanelLayout left={left} right={right} />
      </div>

      {showCreateModal && <CreateSnapshotModal onClose={() => setShowCreateModal(false)} />}
      {showReviewWizard && <ReviewWizard onClose={() => setShowReviewWizard(false)} />}
    </div>
  );
}
