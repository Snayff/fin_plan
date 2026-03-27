import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { ButtonPair } from "@/components/common/ButtonPair";
import { HistoryChart } from "./HistoryChart";
import { useItemHistory, useConfirmItem, useUpdateItem, useEndIncome } from "@/hooks/useWaterfall";
import { isStale, stalenessLabel } from "@/utils/staleness";
import { useSettings } from "@/hooks/useSettings";
import { CreateSnapshotModal } from "./CreateSnapshotModal";
import { NudgeCard } from "@/components/common/NudgeCard";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { useYearlyBillNudge, useSavingsNudge } from "@/hooks/useNudge";
import { Link } from "react-router-dom";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";
import { useWealthAccount } from "@/hooks/useWealth";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
  wealthAccountId?: string | null;
}

interface ItemDetailPanelProps {
  item: SelectedItem;
  onBack: () => void;
  snapshotDate?: Date | null;
  isReadOnly?: boolean;
  onViewCashflow?: () => void;
}

type InlineMode = "none" | "edit" | "end";

export function ItemDetailPanel({
  item,
  onBack,
  snapshotDate,
  isReadOnly: isReadOnlyProp,
  onViewCashflow,
}: ItemDetailPanelProps) {
  const [inlineMode, setInlineMode] = useState<InlineMode>("none");
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showSnapshotPrompt, setShowSnapshotPrompt] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  const {
    data: historyRaw,
    isLoading: historyLoading,
    isError: historyError,
    refetch: historyRefetch,
  } = useItemHistory(item.type, item.id);
  const confirmItem = useConfirmItem();
  const updateItem = useUpdateItem();
  const endIncome = useEndIncome();
  const { data: settings } = useSettings();
  const isReadOnly = !!isReadOnlyProp || snapshotDate != null;
  const { nudge: yearlyBillNudge } = useYearlyBillNudge(item.type, isReadOnly);
  const savingsNudge = useSavingsNudge(item.id, item.type, isReadOnly);
  const { data: linkedAccount } = useWealthAccount(item.wealthAccountId ?? "");

  if (historyLoading && !historyRaw) return <SkeletonLoader variant="right-panel" />;
  if (historyError && !historyRaw)
    return (
      <PanelError variant="detail" onRetry={historyRefetch} message="Could not load item history" />
    );

  const history: { recordedAt: string; value: number }[] = (historyRaw ?? []).map(
    (h: { recordedAt: string; value: number; id: string }) => ({
      recordedAt: h.recordedAt,
      value: h.value,
    })
  );

  const thresholdMonths = (() => {
    const t = settings?.stalenessThresholds;
    if (!t) return 12;
    const map: Record<string, number | undefined> = t as Record<string, number | undefined>;
    return map[item.type] ?? 12;
  })();
  const itemIsStale = isStale(item.lastReviewedAt, thresholdMonths);

  const breadcrumbLabel = (() => {
    switch (item.type) {
      case "income_source":
        return "Income";
      case "committed_bill":
        return "Committed";
      case "yearly_bill":
        return "Committed / Yearly Bills";
      case "discretionary_category":
        return "Discretionary";
      case "savings_allocation":
        return "Discretionary / Savings";
      default:
        return "Overview";
    }
  })();

  function handleConfirm() {
    confirmItem.mutate(
      { type: item.type as Parameters<typeof confirmItem.mutate>[0]["type"], id: item.id },
      {
        onSuccess: () => {
          toast.success("Marked as reviewed");
        },
      }
    );
  }

  function handleSaveEdit() {
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed)) return;
    // Prompt snapshot before changing income source amount
    if (item.type === "income_source" && parsed !== item.amount) {
      setShowSnapshotPrompt(true);
      return;
    }
    doSaveEdit();
  }

  function doSaveEdit() {
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed)) return;

    updateItem.mutate(
      {
        type: item.type as Parameters<typeof updateItem.mutate>[0]["type"],
        id: item.id,
        data: { amount: parsed },
      },
      {
        onSuccess: () => {
          setInlineMode("none");
          toast.success("Updated");
        },
      }
    );
  }

  function handleEndIncome() {
    endIncome.mutate(
      { id: item.id, endedAt: new Date(endDate) },
      {
        onSuccess: () => {
          onBack();
        },
      }
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {breadcrumbLabel} / {item.name}
      </button>

      <div>
        <h2 className="text-lg font-semibold">{item.name}</h2>
        {item.type === "income_source" && (
          <p className="text-xs text-muted-foreground mt-0.5">
            <GlossaryTermMarker entryId="net-income">Net Income</GlossaryTermMarker>
          </p>
        )}
        <p className="text-[30px] font-numeric font-extrabold text-primary mt-1">
          {formatCurrency(item.amount)}
        </p>
        {item.type === "yearly_bill" && (
          <p className="text-sm text-muted-foreground mt-0.5">
            <GlossaryTermMarker entryId="amortised">Amortised (÷12)</GlossaryTermMarker>{" "}
            {formatCurrency(item.amount / 12)}/mo
          </p>
        )}
        <p className={cn("text-sm mt-0.5", itemIsStale && "text-attention")}>
          {stalenessLabel(item.lastReviewedAt)}
        </p>
      </div>

      <HistoryChart data={history} snapshotDate={snapshotDate} />

      {item.type === "savings_allocation" && linkedAccount && (
        <div className="text-sm text-muted-foreground">
          Allocated to:{" "}
          <Link to="/wealth" className="text-primary hover:underline">
            {linkedAccount.name}
          </Link>
        </div>
      )}

      {!isReadOnly && (
        <>
          {inlineMode === "none" && (
            <>
              <ButtonPair
                leftLabel="Edit"
                rightLabel="Still correct ✓"
                onLeftClick={() => {
                  setEditAmount(String(item.amount));
                  setInlineMode("edit");
                }}
                onRightClick={handleConfirm}
                isLoading={confirmItem.isPending}
              />
              {item.type === "yearly_bill" && yearlyBillNudge && (
                <NudgeCard
                  message={yearlyBillNudge.message}
                  options={yearlyBillNudge.options}
                  actionLabel="See cashflow calendar"
                  onAction={onViewCashflow}
                />
              )}
              {item.type === "savings_allocation" && savingsNudge && (
                <NudgeCard message={savingsNudge.message} options={savingsNudge.options} />
              )}
            </>
          )}

          {inlineMode === "edit" && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-amount">
                New amount
              </label>
              <input
                id="edit-amount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-ring"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateItem.isPending}>
                  {updateItem.isPending ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInlineMode("none")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {item.type === "income_source" && inlineMode !== "end" && (
            <button
              type="button"
              onClick={() => setInlineMode("end")}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              End this income source
            </button>
          )}

          {inlineMode === "end" && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="end-date">
                When did this end?
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-ring"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEndIncome} disabled={endIncome.isPending}>
                  {endIncome.isPending ? "Saving…" : "Confirm"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInlineMode("none")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Snapshot prompt for income amount change */}
      {showSnapshotPrompt && (
        <div className="rounded-lg border p-3 space-y-2 bg-accent/30">
          <p className="text-sm font-medium">Save a snapshot before updating?</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setShowSnapshotPrompt(false);
                setShowSnapshotModal(true);
              }}
            >
              Yes, save snapshot first
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSnapshotPrompt(false);
                doSaveEdit();
              }}
            >
              No, update directly
            </Button>
          </div>
        </div>
      )}

      {showSnapshotModal && (
        <CreateSnapshotModal
          onClose={() => {
            setShowSnapshotModal(false);
            doSaveEdit();
          }}
          onCreated={() => {
            setShowSnapshotModal(false);
            doSaveEdit();
          }}
        />
      )}
    </div>
  );
}
