import { useState, useEffect } from "react";
import type React from "react";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import type { WaterfallSummary, IncomeType } from "@finplan/shared";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { PageHeader } from "@/components/common/PageHeader";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { WaterfallLeftPanel } from "@/components/overview/WaterfallLeftPanel";
import { ItemDetailPanel } from "@/components/overview/ItemDetailPanel";
import { IncomeTypePanel } from "@/components/overview/IncomeTypePanel";
import { CommittedBillsPanel } from "@/components/overview/CommittedBillsPanel";
import { SnapshotTimeline } from "@/components/overview/SnapshotTimeline";
import { OverviewPageHeader } from "@/components/overview/OverviewPageHeader";
import { CreateSnapshotModal } from "@/components/overview/CreateSnapshotModal";
import { ReviewWizard } from "@/components/overview/ReviewWizard";
import { FinancialSummaryPanel } from "@/components/overview/FinancialSummaryPanel";
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
  | { type: "income_type"; incomeType: IncomeType; label: string }
  | { type: "committed_bills" };

export default function OverviewPage() {
  const [view, setView] = useState<RightPanelView>({ type: "none" });
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewWizard, setShowReviewWizard] = useState(false);

  const { data: liveSummary, isLoading, isError, refetch } = useWaterfallSummary();
  const {
    data: snapshotData,
    isLoading: snapshotIsLoading,
    isError: snapshotError,
  } = useSnapshot(selectedSnapshotId);

  useEffect(() => {
    if (snapshotError && selectedSnapshotId) {
      setSelectedSnapshotId(null);
    }
  }, [snapshotError, selectedSnapshotId]);

  const isViewingSnapshot = selectedSnapshotId !== null;
  const summary: WaterfallSummary | undefined =
    isViewingSnapshot && snapshotData?.data ? (snapshotData.data as WaterfallSummary) : liveSummary;
  const snapshotDate =
    isViewingSnapshot && snapshotData?.createdAt ? new Date(snapshotData.createdAt) : null;

  // Build left panel content (below the header)
  const leftContent = isLoading ? (
    <SkeletonLoader variant="left-panel" />
  ) : isError && !liveSummary ? (
    <PanelError variant="left" onRetry={refetch} message="Could not load your waterfall" />
  ) : summary ? (
    <WaterfallLeftPanel
      summary={summary}
      selectedItemId={
        view.type === "item"
          ? view.item.id
          : view.type === "income_type"
            ? `type:${view.incomeType}`
            : view.type === "committed_bills"
              ? "aggregate:committed_bills"
              : null
      }
    />
  ) : null;

  const left = (
    <div className="flex flex-col h-full">
      <PageHeader title="Overview" />
      <div className="flex-1 overflow-y-auto">{leftContent}</div>
    </div>
  );

  // Build right panel
  let right: React.ReactNode;
  if (view.type === "item") {
    right = (
      <ItemDetailPanel
        item={view.item}
        onBack={() => setView({ type: "none" })}
        snapshotDate={snapshotDate}
      />
    );
  } else if (view.type === "income_type" && summary) {
    const group = summary.income.byType.find((g) => g.type === view.incomeType);
    right = (
      <IncomeTypePanel
        label={view.label}
        sources={group?.sources ?? []}
        onSelectSource={(item) => setView({ type: "item", item })}
        onBack={() => setView({ type: "none" })}
        selectedItemId={null}
      />
    );
  } else if (view.type === "committed_bills" && summary) {
    right = (
      <CommittedBillsPanel
        bills={summary.committed.bills}
        onSelectBill={(item) => setView({ type: "item", item })}
        onBack={() => setView({ type: "none" })}
        selectedItemId={null}
      />
    );
  } else {
    right = <FinancialSummaryPanel waterfallSummary={summary} isSnapshot={isViewingSnapshot} />;
  }

  return (
    <div data-page="overview" data-testid="overview-page" className="relative flex flex-col h-full">
      <OverviewPageHeader
        activeSnapshot={
          isViewingSnapshot && snapshotData
            ? { id: snapshotData.id, name: snapshotData.name }
            : null
        }
        onExitSnapshot={() => {
          setSelectedSnapshotId(null);
          setView({ type: "none" });
        }}
      />
      <SnapshotTimeline
        selectedId={selectedSnapshotId}
        loadingId={snapshotIsLoading ? selectedSnapshotId : null}
        isViewingSnapshot={isViewingSnapshot}
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

      <div className="flex-1 min-h-0">
        <TwoPanelLayout left={left} right={right} />
      </div>

      {showCreateModal && <CreateSnapshotModal onClose={() => setShowCreateModal(false)} />}
      {showReviewWizard && <ReviewWizard onClose={() => setShowReviewWizard(false)} />}
    </div>
  );
}
