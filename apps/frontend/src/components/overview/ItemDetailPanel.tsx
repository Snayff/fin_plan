import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { ButtonPair } from "@/components/common/ButtonPair";
import { HistoryChart } from "./HistoryChart";
import { useItemHistory, useConfirmItem, useUpdateItem, useEndIncome } from "@/hooks/useWaterfall";
import { isStale, stalenessLabel } from "@/utils/staleness";
import { useSettings } from "@/hooks/useSettings";
import { CreateSnapshotModal } from "./CreateSnapshotModal";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
}

interface ItemDetailPanelProps {
  item: SelectedItem;
  onBack: () => void;
  snapshotDate?: Date | null;
}

type InlineMode = "none" | "edit" | "end";

export function ItemDetailPanel({ item, onBack, snapshotDate }: ItemDetailPanelProps) {
  const [inlineMode, setInlineMode] = useState<InlineMode>("none");
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showSnapshotPrompt, setShowSnapshotPrompt] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  const { data: historyRaw } = useItemHistory(item.type, item.id);

  const history: { recordedAt: string; value: number }[] = (historyRaw ?? []).map(
    (h: { recordedAt: string; value: number; id: string }) => ({
      recordedAt: h.recordedAt,
      value: h.value,
    })
  );

  const confirmItem = useConfirmItem();
  const updateItem = useUpdateItem();
  const endIncome = useEndIncome();
  const { data: settings } = useSettings();

  const isReadOnly = snapshotDate != null;

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
        ← {breadcrumbLabel}
      </button>

      <div>
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-3xl font-bold mt-1">{formatCurrency(item.amount)}</p>
        {item.type === "yearly_bill" && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatCurrency(item.amount / 12)}/mo avg
          </p>
        )}
        <p className="text-sm mt-0.5" style={itemIsStale ? { color: "#f59e0b" } : undefined}>
          {stalenessLabel(item.lastReviewedAt)}
        </p>
      </div>

      <HistoryChart data={history} snapshotDate={snapshotDate} />

      {!isReadOnly && (
        <>
          {inlineMode === "none" && (
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
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updateItem.isPending}
                  className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateItem.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setInlineMode("none")}
                  className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
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
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEndIncome}
                  disabled={endIncome.isPending}
                  className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {endIncome.isPending ? "Saving…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setInlineMode("none")}
                  className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
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
            <button
              type="button"
              className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setShowSnapshotPrompt(false);
                setShowSnapshotModal(true);
              }}
            >
              Yes, save snapshot first
            </button>
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              onClick={() => {
                setShowSnapshotPrompt(false);
                doSaveEdit();
              }}
            >
              No, update directly
            </button>
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
