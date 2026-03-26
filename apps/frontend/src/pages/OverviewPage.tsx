import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { useSearchParams } from "react-router-dom";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import type { WaterfallSummary, IncomeType } from "@finplan/shared";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { WaterfallLeftPanel } from "@/components/overview/WaterfallLeftPanel";
import { ItemDetailPanel } from "@/components/overview/ItemDetailPanel";
import { CashflowCalendar } from "@/components/overview/CashflowCalendar";
import { IncomeTypePanel } from "@/components/overview/IncomeTypePanel";
import { CommittedBillsPanel } from "@/components/overview/CommittedBillsPanel";
import { SnapshotTimeline } from "@/components/overview/SnapshotTimeline";
import { OverviewPageHeader } from "@/components/overview/OverviewPageHeader";
import { CreateSnapshotModal } from "@/components/overview/CreateSnapshotModal";
import { ReviewWizard } from "@/components/overview/ReviewWizard";
import OverviewEmptyState from "@/components/overview/OverviewEmptyState";
import { BuildGuidePanel } from "@/components/overview/build/BuildGuidePanel";
import { type BuildPhase, BUILD_PHASES } from "@/components/overview/build/quick-picks";
import {
  useSetupSession,
  useCreateSetupSession,
  useUpdateSetupSession,
} from "@/hooks/useSetupSession";
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
  | { type: "cashflow" }
  | { type: "income_type"; incomeType: IncomeType; label: string }
  | { type: "committed_bills" };

/** Map setup session step numbers to build phases (7-step wizard) */
const STEP_TO_PHASE: Record<number, BuildPhase> = {
  0: "household",
  1: "income",
  2: "committed",
  3: "yearly_bills",
  4: "discretionary",
  5: "savings",
  6: "summary",
};
const PHASE_TO_STEP: Record<BuildPhase, number> = {
  household: 0,
  income: 1,
  committed: 2,
  yearly_bills: 3,
  discretionary: 4,
  savings: 5,
  summary: 6,
};

export default function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<RightPanelView>({ type: "none" });
  const [year] = useState(() => new Date().getFullYear());
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewWizard, setShowReviewWizard] = useState(false);

  // Build mode state
  const [buildPhase, setBuildPhase] = useState<BuildPhase | null>(null);
  const [prefillName, setPrefillName] = useState<string | null>(null);

  // Session persistence
  const { data: session, isLoading: sessionLoading } = useSetupSession();
  const createSession = useCreateSetupSession();
  const updateSession = useUpdateSetupSession();

  // Restore build mode from existing session or ?build=1 query param
  const [sessionRestored, setSessionRestored] = useState(false);
  if (!sessionLoading && !sessionRestored) {
    setSessionRestored(true);
    if (session) {
      const restored = STEP_TO_PHASE[session.currentStep];
      if (restored && !buildPhase) {
        setBuildPhase(restored);
      }
    } else if (searchParams.get("build") === "1" && !buildPhase) {
      // Coming from welcome page — auto-enter build mode
      setBuildPhase("household");
      createSession.mutate(undefined);
      setSearchParams({}, { replace: true });
    }
  }

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

  const isWaterfallEmpty =
    summary &&
    summary.income.monthly.length === 0 &&
    summary.income.annual.length === 0 &&
    summary.committed.bills.length === 0 &&
    summary.committed.yearlyBills.length === 0 &&
    summary.discretionary.categories.length === 0 &&
    summary.discretionary.savings.allocations.length === 0;

  const inBuild = buildPhase !== null;

  const handleNextPhase = useCallback(() => {
    if (!buildPhase) return;
    const idx = BUILD_PHASES.indexOf(buildPhase);
    if (idx < BUILD_PHASES.length - 1) {
      const next = BUILD_PHASES[idx + 1]!;
      setBuildPhase(next);
      setPrefillName(null);
      updateSession.mutate({ currentStep: PHASE_TO_STEP[next] });
    }
  }, [buildPhase, updateSession]);

  const handlePrevPhase = useCallback(() => {
    if (!buildPhase) return;
    const idx = BUILD_PHASES.indexOf(buildPhase);
    if (idx > 0) {
      const prev = BUILD_PHASES[idx - 1]!;
      setBuildPhase(prev);
      setPrefillName(null);
      updateSession.mutate({ currentStep: PHASE_TO_STEP[prev] });
    }
  }, [buildPhase, updateSession]);

  function handleFinishBuild() {
    setBuildPhase(null);
    setPrefillName(null);
  }

  // Build left panel
  const left = isLoading ? (
    <SkeletonLoader variant="left-panel" />
  ) : isError && !liveSummary ? (
    <PanelError variant="left" onRetry={refetch} message="Could not load your waterfall" />
  ) : inBuild && summary ? (
    <WaterfallLeftPanel
      summary={summary}
      onSelectItem={() => {}}
      onOpenCashflowCalendar={() => {}}
      selectedItemId={null}
      buildPhase={buildPhase}
      prefillName={prefillName}
    />
  ) : summary && !isWaterfallEmpty ? (
    <WaterfallLeftPanel
      summary={summary}
      onSelectItem={(item) => {
        if (item.type === "income_type") {
          setView({
            type: "income_type",
            incomeType: item.id.replace("type:", "") as IncomeType,
            label: item.name,
          });
        } else if (item.type === "committed_bills") {
          setView({ type: "committed_bills" });
        } else {
          setView({ type: "item", item });
        }
      }}
      onOpenCashflowCalendar={() => setView({ type: "cashflow" })}
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
  ) : (
    <OverviewEmptyState />
  );

  // Build right panel
  let right: React.ReactNode;
  if (inBuild) {
    right = (
      <BuildGuidePanel
        phase={buildPhase}
        onNextPhase={handleNextPhase}
        onPrevPhase={handlePrevPhase}
        onQuickPick={(name) => {
          setPrefillName(null);
          setTimeout(() => setPrefillName(name), 0);
        }}
        onFinish={handleFinishBuild}
      />
    );
  } else if (view.type === "item") {
    right = (
      <ItemDetailPanel
        item={view.item}
        onBack={() => setView({ type: "none" })}
        snapshotDate={snapshotDate}
        onViewCashflow={() => setView({ type: "cashflow" })}
      />
    );
  } else if (view.type === "cashflow") {
    right = <CashflowCalendar year={year} onBack={() => setView({ type: "none" })} />;
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
    right = (
      <div
        data-testid="analytics-placeholder"
        className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
      >
        <p className="text-sm font-medium text-foreground/40">Analytics</p>
        <p className="max-w-xs text-xs text-foreground/25">
          Spending trends and cashflow analytics will be available here in a future update.
        </p>
      </div>
    );
  }

  return (
    <div data-page="overview" data-testid="overview-page" className="relative flex flex-col h-full">
      {inBuild ? (
        /* Build mode header */
        <div className="h-10 border-b flex items-center justify-between px-4 text-sm bg-primary/5">
          <span className="font-medium">Building your waterfall</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleFinishBuild}
          >
            Exit setup
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="flex-1 min-h-0">
        <TwoPanelLayout left={left} right={right} />
      </div>

      {showCreateModal && <CreateSnapshotModal onClose={() => setShowCreateModal(false)} />}
      {showReviewWizard && <ReviewWizard onClose={() => setShowReviewWizard(false)} />}
    </div>
  );
}
