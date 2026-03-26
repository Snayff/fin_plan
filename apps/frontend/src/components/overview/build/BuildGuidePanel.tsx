import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { useCreateSnapshot, useHouseholdDetails, useRenameHousehold } from "@/hooks/useSettings";
import { useDeleteSetupSession } from "@/hooks/useSetupSession";
import { useAuthStore } from "@/stores/authStore";
import { EntityAvatar } from "@/components/common/EntityAvatar";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/utils/format";
import { MiniWaterfallChart } from "./MiniWaterfallChart";
import {
  type BuildPhase,
  BUILD_PHASES,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
  QUICK_PICKS,
} from "./quick-picks";

interface BuildGuidePanelProps {
  phase: BuildPhase;
  onNextPhase: () => void;
  onPrevPhase: () => void;
  onQuickPick: (name: string) => void;
  onFinish: () => void;
}

export function BuildGuidePanel({
  phase,
  onNextPhase,
  onPrevPhase,
  onQuickPick,
  onFinish,
}: BuildGuidePanelProps) {
  const { data: summary } = useWaterfallSummary();
  const phaseIndex = BUILD_PHASES.indexOf(phase);

  const income = summary?.income.total ?? 0;
  const committed = (summary?.committed.monthlyTotal ?? 0) + (summary?.committed.monthlyAvg12 ?? 0);
  const discretionary =
    (summary?.discretionary.total ?? 0) + (summary?.discretionary.savings.total ?? 0);
  const surplus = summary?.surplus.amount ?? 0;

  if (phase === "household") {
    return (
      <HouseholdPhase
        phaseIndex={phaseIndex}
        onNextPhase={onNextPhase}
      />
    );
  }

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

  const nextPhaseLabel =
    phaseIndex < BUILD_PHASES.length - 1 ? PHASE_LABELS[BUILD_PHASES[phaseIndex + 1]!] : null;
  const picks = QUICK_PICKS[phase as keyof typeof QUICK_PICKS];

  return (
    <div className="flex flex-col h-full">
      {/* Progress dots */}
      <ProgressDots phaseIndex={phaseIndex} />

      {/* Tier header */}
      <h2 className="text-lg font-semibold mb-1">{PHASE_LABELS[phase]}</h2>
      <p className="text-sm text-muted-foreground mb-5">
        {PHASE_DESCRIPTIONS[phase as keyof typeof PHASE_DESCRIPTIONS]}
      </p>

      {/* Quick picks */}
      {picks.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Quick add
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
      )}

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
        <Button variant="ghost" size="sm" onClick={onPrevPhase} disabled={phaseIndex === 0}>
          ← Back
        </Button>
        <Button size="sm" onClick={onNextPhase}>
          {nextPhaseLabel ? `Next: ${nextPhaseLabel} →` : "Review →"}
        </Button>
      </div>
    </div>
  );
}

function ProgressDots({ phaseIndex }: { phaseIndex: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={phaseIndex + 1}
      aria-valuemin={1}
      aria-valuemax={BUILD_PHASES.length}
      aria-label={`Step ${phaseIndex + 1} of ${BUILD_PHASES.length}`}
      className="flex items-center gap-2 mb-6"
    >
      {BUILD_PHASES.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <div
            aria-hidden="true"
            className={`h-2 w-2 rounded-full transition-colors ${
              i === phaseIndex
                ? "bg-primary scale-125"
                : i < phaseIndex
                  ? "bg-primary/40"
                  : "bg-muted"
            }`}
          />
          {i < BUILD_PHASES.length - 1 && (
            <div aria-hidden="true" className={`h-px w-4 ${i < phaseIndex ? "bg-primary/40" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function HouseholdPhase({
  phaseIndex,
  onNextPhase,
}: {
  phaseIndex: number;
  onNextPhase: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";
  const { data } = useHouseholdDetails(householdId);
  const household = data?.household;
  const renameHousehold = useRenameHousehold();

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  function startRename() {
    setEditName(household?.name ?? "");
    setEditingName(true);
  }

  function handleRename() {
    renameHousehold.mutate(
      { id: householdId, name: editName },
      {
        onSuccess: () => {
          setEditingName(false);
          toast.success("Household renamed");
        },
      }
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ProgressDots phaseIndex={phaseIndex} />

      <h2 className="text-lg font-semibold mb-1">Household</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Confirm your household name and members before building your waterfall.
      </p>

      {/* Household name */}
      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          Household name
        </p>
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              className="h-8 text-sm flex-1"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              aria-label="Household name"
            />
            <Button
              size="sm"
              onClick={handleRename}
              disabled={renameHousehold.isPending || !editName.trim()}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{household?.name ?? "—"}</span>
            <button
              type="button"
              aria-label="Rename household"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={startRename}
            >
              Rename
            </button>
          </div>
        )}
      </div>

      {/* Members list */}
      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          Members
        </p>
        <div className="space-y-1">
          {(household?.members ?? []).map((member) => (
            <div key={member.userId} className="flex items-center gap-2 py-1">
              <EntityAvatar name={member.user.name} size="sm" />
              <span className="text-sm">{member.user.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          To invite members, visit{" "}
          <a href="/settings#household" className="text-primary hover:underline">
            Settings → Household
          </a>
          .
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation — Back disabled on first step */}
      <div className="flex items-center justify-end pt-4 border-t">
        <Button size="sm" onClick={onNextPhase}>
          Next: Income →
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

  const phaseIndex = BUILD_PHASES.indexOf("summary");

  return (
    <div className="flex flex-col h-full">
      <ProgressDots phaseIndex={phaseIndex} />

      <div
        data-testid="build-summary-card"
        className="rounded-xl p-4 mb-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(74,220,208,0.04) 100%)",
          border: "1px solid rgba(168,85,247,0.08)",
        }}
      >
        <h2 className="text-lg font-semibold mb-1">Your waterfall is ready</h2>
        <p className="text-sm text-muted-foreground">Here's how your money flows each month.</p>
      </div>

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
          aria-label="Snapshot name"
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
