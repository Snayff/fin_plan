import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { useAuthStore } from "@/stores/authStore";
import { waterfallService } from "@/services/waterfall.service";
import { wealthService } from "@/services/wealth.service";
import { householdService } from "@/services/household.service";
import { useCreateSnapshot } from "@/hooks/useSettings";
import {
  useSetupSession,
  useCreateSetupSession,
  useUpdateSetupSession,
  useDeleteSetupSession,
} from "@/hooks/useSetupSession";
import {
  useReviewIncome,
  useReviewCommitted,
  useReviewYearly,
  useReviewDiscretionary,
  useReviewSavings,
} from "@/hooks/useReviewSession";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const STEPS = [
  "Household",
  "Income",
  "Monthly Bills",
  "Yearly Bills",
  "Discretionary",
  "Savings",
  "Summary",
];

interface WaterfallSetupWizardProps {
  onClose: () => void;
}

// ─── Step 0: Household ────────────────────────────────────────────────────────

function HouseholdStep() {
  const user = useAuthStore((s) => s.user);
  const householdId = (user as any)?.activeHouseholdId ?? "";
  const { data } = useQuery({
    queryKey: ["household", householdId],
    queryFn: () => householdService.getHouseholdDetails(householdId),
    enabled: !!householdId,
  });
  const household = data?.household;
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function handleRename() {
    if (!householdId) return;
    setSaving(true);
    try {
      await householdService.renameHousehold(householdId, editName);
      void queryClient.invalidateQueries({ queryKey: ["household", householdId] });
      void queryClient.invalidateQueries({ queryKey: ["households"] });
      setEditing(false);
      toast.success("Household renamed");
    } catch {
      toast.error("Failed to rename");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Your household</h3>
      {editing ? (
        <div className="flex items-center gap-2 max-w-sm">
          <input
            className="flex-1 rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <Button size="sm" onClick={handleRename} disabled={saving}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="font-medium">{household?.name ?? "Loading…"}</p>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditName(household?.name ?? "");
              setEditing(true);
            }}
          >
            Rename
          </button>
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">Members</p>
        {(household?.members ?? []).map((m) => (
          <p key={m.userId} className="text-sm text-muted-foreground">
            {m.user.name} · {m.role}
          </p>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Invite more members from Settings → Household.
      </p>
    </div>
  );
}

// ─── Generic add-and-list step ────────────────────────────────────────────────

interface AddItemStepProps {
  title: string;
  items: any[];
  fields: Array<{
    key: string;
    label: string;
    type?: "number" | "text" | "select";
    options?: Array<{ value: string; label: string }>;
  }>;
  onAdd: (values: Record<string, string>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  renderItem: (item: any) => React.ReactNode;
}

function AddItemStep({ title, items, fields, onAdd, onDelete, renderItem }: AddItemStepProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await onAdd(form);
      setForm({});
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">{title}</h3>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id as string}
              className="flex items-center justify-between py-1.5 border-b last:border-b-0"
            >
              <div>{renderItem(item)}</div>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={() =>
                  onDelete(item.id as string).catch(() => toast.error("Failed to delete"))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-3 rounded-lg border p-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{field.label}</label>
            {field.type === "select" ? (
              <select
                className="w-full rounded border px-2 py-1.5 text-sm bg-background"
                value={form[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                required
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                className="w-full rounded border px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={form[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                required
              />
            )}
          </div>
        ))}
        <Button type="submit" size="sm" disabled={adding}>
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>
    </div>
  );
}

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// ─── Step 5: Savings (with wealth account link) ───────────────────────────────

function SavingsStep({ items }: { items: any[] }) {
  const { data: accounts = [] } = useQuery({
    queryKey: ["wealth", "accounts"],
    queryFn: wealthService.listAccounts,
  });
  const savingsAccounts = (accounts as any[]).filter((a) => a.assetClass === "savings");
  const queryClient = useQueryClient();

  async function handleAdd(values: Record<string, string>) {
    await waterfallService.createSavings({
      name: values.name ?? "",
      monthlyAmount: parseFloat(values.monthlyAmount ?? "0") || 0,
      wealthAccountId: values.wealthAccountId || undefined,
    } as any);
    void queryClient.invalidateQueries({ queryKey: ["waterfall", "savings"] });
  }

  async function handleDelete(id: string) {
    await waterfallService.deleteSavings(id);
    void queryClient.invalidateQueries({ queryKey: ["waterfall", "savings"] });
  }

  return (
    <AddItemStep
      title="Savings allocations"
      items={items}
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "monthlyAmount", label: "Monthly amount (£)", type: "number" },
        ...(savingsAccounts.length > 0
          ? [
              {
                key: "wealthAccountId",
                label: "Link to savings account (optional)",
                type: "select" as const,
                options: savingsAccounts.map((a: any) => ({
                  value: a.id as string,
                  label: a.name as string,
                })),
              },
            ]
          : []),
      ]}
      onAdd={handleAdd}
      onDelete={handleDelete}
      renderItem={(item) => (
        <div>
          <p className="text-sm font-medium">{item.name as string}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(item.monthlyAmount as number)}/mo
          </p>
        </div>
      )}
    />
  );
}

// ─── Step 6: Summary ──────────────────────────────────────────────────────────

function SummaryStep({
  saveSnapshot,
  setSaveSnapshot,
  snapshotName,
  setSnapshotName,
}: {
  saveSnapshot: boolean;
  setSaveSnapshot: (v: boolean) => void;
  snapshotName: string;
  setSnapshotName: (v: string) => void;
}) {
  const { data: summary } = useWaterfallSummary();

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Summary</h3>
      {summary ? (
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total income</span>
            <span className="font-medium">{formatCurrency(summary.income.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Committed spend</span>
            <span className="font-medium">
              {formatCurrency(summary.committed.monthlyTotal + summary.committed.monthlyAvg12)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discretionary spend</span>
            <span className="font-medium">
              {formatCurrency(summary.discretionary.total + summary.discretionary.savings.total)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-semibold">Surplus</span>
            <span className="font-bold">{formatCurrency(summary.surplus.amount)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Loading summary…</p>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={saveSnapshot}
          onChange={(e) => setSaveSnapshot(e.target.checked)}
          className="rounded"
        />
        Save an opening snapshot
      </label>

      {saveSnapshot && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Snapshot name</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function WaterfallSetupWizard({ onClose }: WaterfallSetupWizardProps) {
  const { data: session, isLoading: sessionLoading } = useSetupSession();
  const createSession = useCreateSetupSession();
  const updateSession = useUpdateSetupSession();
  const deleteSession = useDeleteSetupSession();
  const createSnapshot = useCreateSnapshot();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [saveSnapshot, setSaveSnapshot] = useState(true);
  const [snapshotName, setSnapshotName] = useState(
    `Initial setup — ${format(new Date(), "MMMM yyyy")}`
  );
  const [finishing, setFinishing] = useState(false);

  const { data: income = [] } = useReviewIncome();
  const { data: committed = [] } = useReviewCommitted();
  const { data: yearly = [] } = useReviewYearly();
  const { data: discretionary = [] } = useReviewDiscretionary();
  const { data: savings = [] } = useReviewSavings();

  useEffect(() => {
    if (sessionLoading || initialized) return;
    setInitialized(true);
    if (session) {
      setCurrentStep(session.currentStep);
    } else {
      createSession.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading, initialized]);

  function goNext() {
    const next = currentStep + 1;
    setCurrentStep(next);
    updateSession.mutate({ currentStep: next });
  }

  function goPrev() {
    const prev = Math.max(0, currentStep - 1);
    setCurrentStep(prev);
    updateSession.mutate({ currentStep: prev });
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      if (saveSnapshot) {
        await createSnapshot.mutateAsync(snapshotName);
        void queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      }
      deleteSession.mutate(undefined);
      void queryClient.invalidateQueries({ queryKey: ["waterfall", "summary"] });
      navigate("/overview");
      onClose();
    } catch {
      toast.error("Failed to complete setup");
    } finally {
      setFinishing(false);
    }
  }

  async function handleAddIncome(values: Record<string, string>) {
    await waterfallService.createIncome({
      name: values.name ?? "",
      amount: parseFloat(values.amount ?? "0") || 0,
      frequency: "monthly",
    } as any);
    void queryClient.invalidateQueries({ queryKey: ["waterfall", "income"] });
  }

  async function handleAddCommitted(values: Record<string, string>) {
    await waterfallService.createCommitted({
      name: values.name ?? "",
      amount: parseFloat(values.amount ?? "0") || 0,
    } as any);
    void queryClient.invalidateQueries({ queryKey: ["waterfall", "committed"] });
  }

  async function handleAddYearly(values: Record<string, string>) {
    await waterfallService.createYearly({
      name: values.name ?? "",
      amount: parseFloat(values.amount ?? "0") || 0,
      dueMonth: parseInt(values.dueMonth ?? "1") || 1,
    } as any);
    void queryClient.invalidateQueries({ queryKey: ["waterfall", "yearly"] });
  }

  async function handleAddDiscretionary(values: Record<string, string>) {
    await waterfallService.createDiscretionary({
      name: values.name ?? "",
      monthlyBudget: parseFloat(values.monthlyBudget ?? "0") || 0,
    } as any);
    void queryClient.invalidateQueries({ queryKey: ["waterfall", "discretionary"] });
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <HouseholdStep />;
      case 1:
        return (
          <AddItemStep
            title="Income sources"
            items={income as any[]}
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "amount", label: "Monthly amount (£)", type: "number" },
            ]}
            onAdd={handleAddIncome}
            onDelete={async (id) => {
              await waterfallService.deleteIncome(id);
              void queryClient.invalidateQueries({ queryKey: ["waterfall", "income"] });
            }}
            renderItem={(item) => (
              <div>
                <p className="text-sm font-medium">{item.name as string}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.amount as number)}/mo
                </p>
              </div>
            )}
          />
        );
      case 2:
        return (
          <AddItemStep
            title="Monthly bills"
            items={committed as any[]}
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "amount", label: "Amount (£)", type: "number" },
            ]}
            onAdd={handleAddCommitted}
            onDelete={async (id) => {
              await waterfallService.deleteCommitted(id);
              void queryClient.invalidateQueries({ queryKey: ["waterfall", "committed"] });
            }}
            renderItem={(item) => (
              <div>
                <p className="text-sm font-medium">{item.name as string}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.amount as number)}/mo
                </p>
              </div>
            )}
          />
        );
      case 3:
        return (
          <AddItemStep
            title="Yearly bills"
            items={yearly as any[]}
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "amount", label: "Annual amount (£)", type: "number" },
              { key: "dueMonth", label: "Due month", type: "select", options: MONTH_OPTIONS },
            ]}
            onAdd={handleAddYearly}
            onDelete={async (id) => {
              await waterfallService.deleteYearly(id);
              void queryClient.invalidateQueries({ queryKey: ["waterfall", "yearly"] });
            }}
            renderItem={(item) => (
              <div>
                <p className="text-sm font-medium">{item.name as string}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.amount as number)}/yr · Month {item.dueMonth as number}
                </p>
              </div>
            )}
          />
        );
      case 4:
        return (
          <AddItemStep
            title="Discretionary categories"
            items={discretionary as any[]}
            fields={[
              { key: "name", label: "Category name", type: "text" },
              { key: "monthlyBudget", label: "Monthly budget (£)", type: "number" },
            ]}
            onAdd={handleAddDiscretionary}
            onDelete={async (id) => {
              await waterfallService.deleteDiscretionary(id);
              void queryClient.invalidateQueries({ queryKey: ["waterfall", "discretionary"] });
            }}
            renderItem={(item) => (
              <div>
                <p className="text-sm font-medium">{item.name as string}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.monthlyBudget as number)}/mo
                </p>
              </div>
            )}
          />
        );
      case 5:
        return <SavingsStep items={savings as any[]} />;
      case 6:
        return (
          <SummaryStep
            saveSnapshot={saveSnapshot}
            setSaveSnapshot={setSaveSnapshot}
            snapshotName={snapshotName}
            setSnapshotName={setSnapshotName}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((label, i) => (
              <span
                key={i}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                      ? "bg-muted text-muted-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={onClose}
        >
          ✕ Exit
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">{renderStep()}</div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentStep === 0}>
          ← Back
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button size="sm" onClick={goNext}>
            Next →
          </Button>
        ) : (
          <Button size="sm" onClick={handleFinish} disabled={finishing}>
            {finishing ? "Finishing…" : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
