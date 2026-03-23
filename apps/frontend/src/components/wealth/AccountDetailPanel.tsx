import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { HistoryChart } from "@/components/overview/HistoryChart";
import { ButtonPair } from "@/components/common/ButtonPair";
import {
  useAccountHistory,
  useUpdateValuation,
  useConfirmAccount,
  useUpdateAccount,
} from "@/hooks/useWealth";
import { Button } from "@/components/ui/button";

const CLASS_LABELS: Record<string, string> = {
  savings: "Savings",
  pensions: "Pensions",
  investments: "Investments",
  property: "Property",
  vehicles: "Vehicles",
  other: "Other",
};

type InlineMode = "none" | "edit" | "valuation";

interface AccountDetailPanelProps {
  account: any;
  onBack: () => void;
}

function monthsUntilEndOfYear(): number {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const months =
    (endOfYear.getFullYear() - now.getFullYear()) * 12 + (endOfYear.getMonth() - now.getMonth());
  return Math.max(0, months);
}

export function AccountDetailPanel({ account, onBack }: AccountDetailPanelProps) {
  const [inlineMode, setInlineMode] = useState<InlineMode>("none");

  // Edit form state
  const [editName, setEditName] = useState<string>(account.name ?? "");
  const [editProvider, setEditProvider] = useState<string>(account.provider ?? "");
  const [editInterestRate, setEditInterestRate] = useState<string>(
    account.interestRate != null ? String(account.interestRate) : ""
  );

  // Valuation form state
  const [valuationBalance, setValuationBalance] = useState<string>(
    account.balance != null ? String(account.balance) : ""
  );
  const [valuationDate, setValuationDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { data: history = [] } = useAccountHistory(account.id);
  const updateValuation = useUpdateValuation();
  const confirmAccount = useConfirmAccount();
  const updateAccount = useUpdateAccount();

  const isSavings = account.assetClass === "savings";

  // Savings projection
  const linkedContrib: number = (account.savingsAllocations ?? []).reduce(
    (sum: number, alloc: any) => sum + (alloc.monthlyAmount ?? 0),
    0
  );

  let projectedBalance: number | null = null;
  if (isSavings && account.interestRate != null && linkedContrib > 0) {
    const monthlyRate = account.interestRate / 12 / 100;
    const months = monthsUntilEndOfYear();
    const balance: number = account.balance ?? 0;
    projectedBalance =
      monthlyRate > 0
        ? balance * Math.pow(1 + monthlyRate, months) +
          (linkedContrib * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate
        : balance + linkedContrib * months;
  }

  function handleSaveEdit() {
    const data: Record<string, unknown> = {
      name: editName,
      provider: editProvider || undefined,
    };
    if (isSavings && editInterestRate !== "") {
      data.interestRate = parseFloat(editInterestRate);
    }
    updateAccount.mutate(
      { id: account.id, data: data as any },
      { onSuccess: () => setInlineMode("none") }
    );
  }

  function handleSaveValuation() {
    updateValuation.mutate(
      {
        id: account.id,
        data: {
          balance: parseFloat(valuationBalance),
          valuationDate: new Date(valuationDate),
        },
      },
      {
        onSuccess: () => {
          setInlineMode("none");
          toast.success("Valuation updated");
        },
      }
    );
  }

  function handleConfirm() {
    confirmAccount.mutate(account.id, {
      onSuccess: () => {
        toast.success("Account confirmed");
      },
    });
  }

  const historyChartData = history.map((h: any) => ({
    recordedAt: h.recordedAt ?? h.valuationDate,
    value: h.balance ?? h.value,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={onBack}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← {CLASS_LABELS[account.assetClass] ?? account.assetClass}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{account.name}</span>
      </div>

      {/* Balance */}
      <div>
        <p className="text-3xl font-bold">{formatCurrency(account.balance ?? 0)}</p>
        {account.valuationDate && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Valued {format(new Date(account.valuationDate), "dd MMM yyyy")}
          </p>
        )}
        {isSavings && account.interestRate != null && (
          <p className="text-sm text-muted-foreground">{account.interestRate}% p.a.</p>
        )}
      </div>

      {/* History Chart */}
      <HistoryChart data={historyChartData} />

      {/* Savings Projection */}
      {isSavings && projectedBalance != null && (
        <p className="text-sm text-muted-foreground">
          Projected to Dec 31:{" "}
          <span className="font-medium text-foreground">{formatCurrency(projectedBalance)}</span>
        </p>
      )}

      {/* Actions */}
      <ButtonPair
        leftLabel="Edit"
        rightLabel="Update valuation"
        onLeftClick={() => setInlineMode(inlineMode === "edit" ? "none" : "edit")}
        onRightClick={() => setInlineMode(inlineMode === "valuation" ? "none" : "valuation")}
      />

      {/* Inline Edit Form */}
      {inlineMode === "edit" && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Provider</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={editProvider}
              onChange={(e) => setEditProvider(e.target.value)}
            />
          </div>
          {isSavings && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Interest rate (%)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={editInterestRate}
                onChange={(e) => setEditInterestRate(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} disabled={updateAccount.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setInlineMode("none")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Inline Valuation Form */}
      {inlineMode === "valuation" && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Balance</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={valuationBalance}
              onChange={(e) => setValuationBalance(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Valuation date</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={valuationDate}
              onChange={(e) => setValuationDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveValuation} disabled={updateValuation.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setInlineMode("none")}>
              Cancel
            </Button>
          </div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            onClick={handleConfirm}
            disabled={confirmAccount.isPending}
          >
            Confirm — still correct ✓
          </button>
        </div>
      )}

      {/* Confirm link (outside valuation form) */}
      {inlineMode === "none" && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleConfirm}
          disabled={confirmAccount.isPending}
        >
          Confirm — still correct ✓
        </button>
      )}
    </div>
  );
}
