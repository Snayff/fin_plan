import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { useCreateSnapshot } from "@/hooks/useSettings";
import { useDeleteSetupSession } from "@/hooks/useSetupSession";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/utils/format";
import { MiniWaterfallChart } from "./MiniWaterfallChart";
import {
  type BuildPhase,
  BUILD_PHASES,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
  QUICK_PICKS,
  SAVINGS_QUICK_PICKS,
} from "./quick-picks";

interface BuildGuidePanelProps {
  phase: BuildPhase;
  onNextPhase: () => void;
  onPrevPhase: () => void;
  onQuickPick: (name: string) => void;
  onFinish: () => void;
  /** Whether the savings sub-form is active in discretionary phase */
  isSavingsActive: boolean;
}

export function BuildGuidePanel({
  phase,
  onNextPhase,
  onPrevPhase,
  onQuickPick,
  onFinish,
  isSavingsActive,
}: BuildGuidePanelProps) {
  const { data: summary } = useWaterfallSummary();
  const phaseIndex = BUILD_PHASES.indexOf(phase);

  const income = summary?.income.total ?? 0;
  const committed =
    (summary?.committed.monthlyTotal ?? 0) + (summary?.committed.monthlyAvg12 ?? 0);
  const discretionary =
    (summary?.discretionary.total ?? 0) + (summary?.discretionary.savings.total ?? 0);
  const surplus = summary?.surplus.amount ?? 0;

  if (phase === "summary") {
    return (
      <SummaryPhase
        income={income}
        committed={committed}
        discretionary={discretionary}
        surplus={surplus}
        onPrevPhase={onPrevPhase}
        onFinish={onFinish}
      />
    );
  }

  const nextPhaseLabel = phaseIndex < BUILD_PHASES.length - 1 ? PHASE_LABELS[BUILD_PHASES[phaseIndex + 1]!] : null;
  const picks = isSavingsActive ? SAVINGS_QUICK_PICKS : QUICK_PICKS[phase];

  return (
    <div className="flex flex-col h-full">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-6">
        {BUILD_PHASES.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                i === phaseIndex
                  ? "bg-primary scale-125"
                  : i < phaseIndex
                    ? "bg-primary/40"
                    : "bg-muted"
              }`}
            />
            {i < BUILD_PHASES.length - 1 && (
              <div
                className={`h-px w-6 ${i < phaseIndex ? "bg-primary/40" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Tier header */}
      <h2 className="text-lg font-semibold mb-1">{PHASE_LABELS[phase]}</h2>
      <p className="text-sm text-muted-foreground mb-5">{PHASE_DESCRIPTIONS[phase]}</p>

      {/* Quick picks */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {isSavingsActive ? "Common savings" : "Quick add"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {picks.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => onQuickPick(pick)}
              className="text-xs px-2.5 py-1 rounded-full border hover:bg-accent/50 transition-colors"
            >
              {pick}
            </button>
          ))}
        </div>
      </div>

      {/* Live cascade */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          Your waterfall
        </p>
        <MiniWaterfallChart
          income={income}
          committed={committed}
          discretionary={discretionary}
          surplus={surplus}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevPhase}
          disabled={phaseIndex === 0}
        >
          ← Back
        </Button>
        <Button size="sm" onClick={onNextPhase}>
          {nextPhaseLabel ? `Next: ${nextPhaseLabel} →` : "Review →"}
        </Button>
      </div>
    </div>
  );
}

function SummaryPhase({
  income,
  committed,
  discretionary,
  surplus,
  onPrevPhase,
  onFinish,
}: {
  income: number;
  committed: number;
  discretionary: number;
  surplus: number;
  onPrevPhase: () => void;
  onFinish: () => void;
}) {
  const [saveSnapshot, setSaveSnapshot] = useState(true);
  const [snapshotName, setSnapshotName] = useState(
    `Initial setup — ${format(new Date(), "MMMM yyyy")}`
  );
  const [finishing, setFinishing] = useState(false);
  const createSnapshot = useCreateSnapshot();
  const deleteSession = useDeleteSetupSession();
  const queryClient = useQueryClient();

  async function handleFinish() {
    setFinishing(true);
    try {
      if (saveSnapshot) {
        await createSnapshot.mutateAsync(snapshotName);
        void queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      }
      deleteSession.mutate(undefined);
      void queryClient.invalidateQueries({ queryKey: ["waterfall", "summary"] });
      onFinish();
    } catch {
      toast.error("Failed to complete setup");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress dots — all complete */}
      <div className="flex items-center gap-2 mb-6">
        {BUILD_PHASES.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                i === BUILD_PHASES.length - 1 ? "bg-primary scale-125" : "bg-primary/40"
              }`}
            />
            {i < BUILD_PHASES.length - 1 && <div className="h-px w-6 bg-primary/40" />}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-1">Your waterfall is ready</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Here's how your money flows each month.
      </p>

      {/* Full cascade viz */}
      <MiniWaterfallChart
        income={income}
        committed={committed}
        discretionary={discretionary}
        surplus={surplus}
      />

      {/* Summary numbers */}
      <div className="rounded-lg border p-4 space-y-2 text-sm mt-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total income</span>
          <span className="font-mono font-medium">{formatCurrency(income)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Committed spend</span>
          <span className="font-mono font-medium">{formatCurrency(committed)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discretionary</span>
          <span className="font-mono font-medium">{formatCurrency(discretionary)}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Monthly surplus</span>
          <span className="font-mono font-bold">{formatCurrency(surplus)}</span>
        </div>
      </div>

      {/* Snapshot option */}
      <label htmlFor="save-snapshot" className="flex items-center gap-2 text-sm mt-4">
        <Checkbox
          id="save-snapshot"
          checked={saveSnapshot}
          onCheckedChange={(checked) => setSaveSnapshot(checked === true)}
        />
        Save an opening snapshot
      </label>
      {saveSnapshot && (
        <Input
          className="mt-2 h-8 text-sm"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={onPrevPhase}>
          ← Back
        </Button>
        <Button size="sm" onClick={handleFinish} disabled={finishing}>
          {finishing ? "Finishing…" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
