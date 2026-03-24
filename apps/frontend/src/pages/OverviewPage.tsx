import { useState, useCallback } from "react";
import type React from "react";
import { useSearchParams } from "react-router-dom";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import type { WaterfallSummary } from "@finplan/shared";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { WaterfallLeftPanel } from "@/components/overview/WaterfallLeftPanel";
import { ItemDetailPanel } from "@/components/overview/ItemDetailPanel";
import { CashflowCalendar } from "@/components/overview/CashflowCalendar";
import { SnapshotTimeline } from "@/components/overview/SnapshotTimeline";
import { CreateSnapshotModal } from "@/components/overview/CreateSnapshotModal";
import { ReviewWizard } from "@/components/overview/ReviewWizard";
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
  | { type: "cashflow" };

/** Map setup session step numbers to build phases */
const STEP_TO_PHASE: Record<number, BuildPhase> = {
  0: "income",
  1: "committed",
  2: "discretionary",
  3: "summary",
};
const PHASE_TO_STEP: Record<BuildPhase, number> = {
  income: 0,
  committed: 1,
  discretionary: 2,
  summary: 3,
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
  const [isSavingsActive, setIsSavingsActive] = useState(false);

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
      setBuildPhase("income");
      createSession.mutate(undefined);
      setSearchParams({}, { replace: true });
    }
  }

  const { data: liveSummary, isLoading } = useWaterfallSummary();
  const { data: snapshotData } = useSnapshot(selectedSnapshotId);

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

  function enterBuildMode() {
    createSession.mutate(undefined);
    setBuildPhase("income");
  }

  const handleNextPhase = useCallback(() => {
    if (!buildPhase) return;
    const idx = BUILD_PHASES.indexOf(buildPhase);
    if (idx < BUILD_PHASES.length - 1) {
      const next = BUILD_PHASES[idx + 1]!;
      setBuildPhase(next);
      setIsSavingsActive(false);
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
      setIsSavingsActive(false);
      setPrefillName(null);
      updateSession.mutate({ currentStep: PHASE_TO_STEP[prev] });
    }
  }, [buildPhase, updateSession]);

  function handleFinishBuild() {
    setBuildPhase(null);
    setIsSavingsActive(false);
    setPrefillName(null);
  }

  // Build left panel
  const left = isLoading ? (
    <SkeletonLoader variant="left-panel" />
  ) : inBuild && summary ? (
    <WaterfallLeftPanel
      summary={summary}
      onSelectItem={() => {}}
      onOpenCashflowCalendar={() => {}}
      selectedItemId={null}
      buildPhase={buildPhase}
      prefillName={prefillName}
      isSavingsActive={isSavingsActive}
      onToggleSavings={() => setIsSavingsActive((v) => !v)}
    />
  ) : summary && !isWaterfallEmpty ? (
    <WaterfallLeftPanel
      summary={summary}
      onSelectItem={(item) => setView({ type: "item", item })}
      onOpenCashflowCalendar={() => setView({ type: "cashflow" })}
      selectedItemId={view.type === "item" ? view.item.id : null}
    />
  ) : (
    <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">No waterfall set up yet.</p>
      <button
        type="button"
        className="text-sm text-primary hover:underline"
        onClick={enterBuildMode}
      >
        Set up your waterfall from scratch ▸
      </button>
    </div>
  );

  // Build right panel
  let right: React.ReactNode | null = null;
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
        isSavingsActive={isSavingsActive}
      />
    );
  } else if (view.type === "item") {
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
      ) : isViewingSnapshot ? (
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
