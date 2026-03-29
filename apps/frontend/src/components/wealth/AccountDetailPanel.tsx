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
import { isStale, stalenessLabel } from "@/utils/staleness";
import { useSettings } from "@/hooks/useSettings";
import { CLASS_LABELS } from "./assetClassLabels";
import { NudgeCard } from "@/components/common/NudgeCard";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { useWealthAccountNudge } from "@/hooks/useNudge";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";
import { cn } from "@/lib/utils";

type InlineMode = "none" | "edit" | "valuation";

interface AccountDetailPanelProps {
  account: any;
  onBack: () => void;
}

function isNewTaxYearBannerNeeded(updatedAt: string | undefined): boolean {
  if (!updatedAt) return false;
  const now = new Date();
  const mostRecentApril6 = new Date(now.getFullYear(), 3, 6);
  if (now < mostRecentApril6) return false;
  return new Date(updatedAt) < mostRecentApril6;
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

  const {
    data: historyRaw,
    isLoading: historyLoading,
    isError: historyError,
    refetch: historyRefetch,
  } = useAccountHistory(account.id);
  const updateValuation = useUpdateValuation();
  const confirmAccount = useConfirmAccount();
  const updateAccount = useUpdateAccount();
  const { data: settings } = useSettings();
  const savingsNudge = useWealthAccountNudge(account);

  if (historyLoading && !historyRaw) return <SkeletonLoader variant="right-panel" />;
  if (historyError && !historyRaw)
    return (
      <PanelError
        variant="detail"
        onRetry={historyRefetch}
        message="Could not load account history"
      />
    );

  const history = historyRaw ?? [];

  const wealthThreshold = settings?.stalenessThresholds?.wealth_account ?? 3;
  const lastReviewedAt: string | undefined = account.lastReviewedAt;
  const accountIsStale = lastReviewedAt ? isStale(lastReviewedAt, wealthThreshold) : false;

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
          type="button"
          onClick={onBack}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          ←{" "}
          {account.isTrust && account.trustBeneficiaryName
            ? account.trustBeneficiaryName
            : (CLASS_LABELS[account.assetClass] ?? account.assetClass)}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{account.name}</span>
      </div>

      {/* ISA new tax year banner */}
      {isSavings && account.isISA && isNewTaxYearBannerNeeded(account.updatedAt) && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          It's a new tax year — your ISA allowance has reset. Update your contributions for each ISA
          account.
        </div>
      )}

      {/* Balance */}
      <div>
        {!isSavings && (
          <p className="text-xs text-muted-foreground mb-0.5">
            <GlossaryTermMarker entryId="equity-value">Equity Value</GlossaryTermMarker>
          </p>
        )}
        <p className="text-3xl font-bold">{formatCurrency(account.balance ?? 0)}</p>
        {account.valuationDate && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Valued {format(new Date(account.valuationDate), "dd MMM yyyy")}
          </p>
        )}
        {isSavings && account.interestRate != null && (
          <p className="text-sm text-muted-foreground">{account.interestRate}% p.a.</p>
        )}
        {isSavings && linkedContrib > 0 && (
          <p className="text-sm text-muted-foreground">
            Monthly contribution:{" "}
            <span className="font-medium text-foreground">{formatCurrency(linkedContrib)}/mo</span>
          </p>
        )}
        {lastReviewedAt && (
          <p className={cn("text-sm mt-0.5", accountIsStale && "text-attention")}>
            {stalenessLabel(lastReviewedAt)}
          </p>
        )}
      </div>

      {/* History Chart */}
      <HistoryChart data={historyChartData} />

      {/* Savings Projection */}
      {isSavings && projectedBalance != null && (
        <p className="text-sm text-muted-foreground">
          <GlossaryTermMarker entryId="projection">Projection</GlossaryTermMarker> to Dec 31:{" "}
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

      {isSavings && savingsNudge && inlineMode === "none" && (
        <NudgeCard message={savingsNudge.message} options={savingsNudge.options} />
      )}

      {/* Inline Edit Form */}
      {inlineMode === "edit" && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Provider</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
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
                className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
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
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
              value={valuationBalance}
              onChange={(e) => setValuationBalance(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Valuation date</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
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
            type="button"
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
          type="button"
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
