import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { useCreatePurchase, useUpdatePurchase, useDeletePurchase } from "@/hooks/usePlanner";

interface PurchaseListPanelProps {
  year: number;
  purchases: any[];
  isReadOnly: boolean;
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

const FUNDING_SOURCE_LABELS: Record<string, string> = {
  savings: "Savings",
  bonus: "Bonus",
  purchasing_budget: "Purchasing budget",
};

const FUNDING_SOURCES = ["savings", "bonus", "purchasing_budget"] as const;

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "high") {
    return <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />;
  }
  if (priority === "medium") {
    return <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />;
  }
  return null;
}

interface EditFormState {
  name: string;
  estimatedCost: string;
  priority: string;
  scheduledThisYear: boolean;
  status: string;
  comment: string;
  fundingSources: string[];
}

function PurchaseRow({ purchase, isReadOnly }: { purchase: any; isReadOnly: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    name: purchase.name ?? "",
    estimatedCost: String(purchase.estimatedCost ?? ""),
    priority: purchase.priority ?? "medium",
    scheduledThisYear: purchase.scheduledThisYear ?? false,
    status: purchase.status ?? "planned",
    comment: purchase.comment ?? "",
    fundingSources: purchase.fundingSources ?? [],
  });

  const updateMutation = useUpdatePurchase();
  const deleteMutation = useDeletePurchase();

  function handleSave() {
    updateMutation.mutate(
      {
        id: purchase.id,
        data: {
          name: form.name,
          estimatedCost: parseFloat(form.estimatedCost) || 0,
          priority: form.priority as any,
          scheduledThisYear: form.scheduledThisYear,
          status: form.status as any,
          comment: form.comment || undefined,
          fundingSources: form.fundingSources as any,
        },
      },
      {
        onSuccess: () => {
          toast.success("Purchase updated");
          setExpanded(false);
        },
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(purchase.id, {
      onSuccess: () => {
        toast.success("Purchase deleted");
        setExpanded(false);
      },
    });
  }

  function toggleFundingSource(source: string) {
    setForm((prev) => ({
      ...prev,
      fundingSources: prev.fundingSources.includes(source)
        ? prev.fundingSources.filter((s) => s !== source)
        : [...prev.fundingSources, source],
    }));
  }

  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <span className="flex-1 font-medium text-sm truncate">{purchase.name}</span>
          <PriorityBadge priority={purchase.priority} />
          <span className="text-sm font-medium shrink-0">
            {formatCurrency(purchase.estimatedCost ?? 0)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {STATUS_LABELS[purchase.status] ?? purchase.status}
        </p>
      </button>

      {expanded && (
        <div className="px-3 pb-4 pt-2 space-y-3 bg-accent/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm bg-background"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Estimated cost</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm bg-background"
                value={form.estimatedCost}
                onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Priority</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm bg-background"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                disabled={isReadOnly}
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm bg-background"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                disabled={isReadOnly}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`scheduled-${purchase.id}`}
              checked={form.scheduledThisYear}
              onChange={(e) => setForm((f) => ({ ...f, scheduledThisYear: e.target.checked }))}
              disabled={isReadOnly}
              className="rounded"
            />
            <label htmlFor={`scheduled-${purchase.id}`} className="text-sm">
              Scheduled this year
            </label>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Funding sources</label>
            <div className="flex flex-wrap gap-3">
              {FUNDING_SOURCES.map((source) => (
                <label key={source} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.fundingSources.includes(source)}
                    onChange={() => toggleFundingSource(source)}
                    disabled={isReadOnly}
                    className="rounded"
                  />
                  {FUNDING_SOURCE_LABELS[source]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Comment</label>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
              rows={2}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              disabled={isReadOnly}
            />
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AddPurchaseFormProps {
  year: number;
  onCancel: () => void;
}

function AddPurchaseForm({ year, onCancel }: AddPurchaseFormProps) {
  const [name, setName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [scheduledThisYear, setScheduledThisYear] = useState(false);

  const createMutation = useCreatePurchase();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      {
        name,
        estimatedCost: parseFloat(estimatedCost) || 0,
        scheduledThisYear,
        year,
      } as any,
      {
        onSuccess: () => {
          toast.success("Purchase added");
          onCancel();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded-lg space-y-3 mt-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Name</label>
        <input
          className="w-full border rounded px-2 py-1 text-sm bg-background"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Estimated cost</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1 text-sm bg-background"
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={scheduledThisYear}
          onChange={(e) => setScheduledThisYear(e.target.checked)}
          className="rounded"
        />
        Scheduled this year
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adding…" : "Add purchase"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface PurchaseGroupProps {
  label: string;
  purchases: any[];
  isReadOnly: boolean;
}

function PurchaseGroup({ label, purchases, isReadOnly }: PurchaseGroupProps) {
  if (purchases.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
        {label}
      </p>
      <div className="rounded-lg border overflow-hidden">
        {purchases.map((p) => (
          <PurchaseRow key={p.id} purchase={p} isReadOnly={isReadOnly} />
        ))}
      </div>
    </div>
  );
}

export function PurchaseListPanel({ year, purchases, isReadOnly }: PurchaseListPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const scheduled = purchases.filter((p) => p.scheduledThisYear === true && p.status !== "done");
  const unscheduled = purchases.filter((p) => p.scheduledThisYear === false);
  const done = purchases.filter((p) => p.status === "done");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Purchases — {year}</h2>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddForm((v) => !v)}
            disabled={isReadOnly}
          >
            + Add
          </Button>
        )}
      </div>

      {showAddForm && <AddPurchaseForm year={year} onCancel={() => setShowAddForm(false)} />}

      {purchases.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground italic text-center py-8">No purchases yet</p>
      )}

      <PurchaseGroup label="Scheduled" purchases={scheduled} isReadOnly={isReadOnly} />
      <PurchaseGroup label="Unscheduled" purchases={unscheduled} isReadOnly={isReadOnly} />
      <PurchaseGroup label="Done" purchases={done} isReadOnly={isReadOnly} />
    </div>
  );
}
