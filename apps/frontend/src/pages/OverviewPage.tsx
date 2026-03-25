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
import { WaterfallConnector } from "@/components/overview/WaterfallConnector";
import { Button } from "@/components/ui/button";
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
      isSavingsActive={isSavingsActive}
      onToggleSavings={() => setIsSavingsActive((v) => !v)}
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
    <div className="p-4 space-y-0">
      {/* Ghosted tier headers */}
      <div className="flex items-center justify-between py-1.5 px-2 opacity-25">
        <span className="text-[13px] font-heading font-semibold tracking-tier uppercase text-tier-income">
          Income
        </span>
        <span className="text-[15px] font-numeric font-semibold text-tier-income">£—</span>
      </div>
      <div className="opacity-20">
        <WaterfallConnector text="minus committed" />
      </div>
      <div className="flex items-center justify-between py-1.5 px-2 opacity-25">
        <span className="text-[13px] font-heading font-semibold tracking-tier uppercase text-tier-committed">
          Committed
        </span>
        <span className="text-[15px] font-numeric font-semibold text-tier-committed">£—</span>
      </div>
      <div className="opacity-20">
        <WaterfallConnector text="minus discretionary" />
      </div>
      <div className="flex items-center justify-between py-1.5 px-2 opacity-25">
        <span className="text-[13px] font-heading font-semibold tracking-tier uppercase text-tier-discretionary">
          Discretionary
        </span>
        <span className="text-[15px] font-numeric font-semibold text-tier-discretionary">£—</span>
      </div>
      <div className="opacity-20">
        <WaterfallConnector text="equals" />
      </div>
      <div className="flex items-center justify-between py-1.5 px-2 opacity-25">
        <span className="text-[13px] font-heading font-semibold tracking-tier uppercase text-tier-surplus">
          Surplus
        </span>
        <span className="text-[15px] font-numeric font-semibold text-tier-surplus">£—</span>
      </div>

      {/* CTA card */}
      <div
        className="mt-6 mx-2 p-5 rounded-lg text-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(168, 85, 247, 0.05) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.1)",
        }}
      >
        <p className="text-[15px] font-heading font-semibold text-foreground">
          Build your waterfall
        </p>
        <p className="text-[13px] text-muted-foreground mt-1">
          See where your money flows — from income through to surplus.
        </p>
        <Button className="mt-4" onClick={enterBuildMode}>
          Get started
        </Button>
      </div>
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
  }

  return (
    <div data-page="overview" className="relative flex flex-col h-full">
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
