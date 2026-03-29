import { useState } from "react";
import type { AssetClass, IsaAllowance } from "@finplan/shared";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import { useSettings } from "@/hooks/useSettings";
import { useCreateAccount } from "@/hooks/useWealth";

import { CLASS_LABELS } from "./assetClassLabels";

interface AccountListPanelProps {
  assetClass: AssetClass | string;
  accounts: any[];
  isaTotals?: IsaAllowance;
  onSelectAccount: (acc: any) => void;
  onBack: () => void;
  selectedAccountId: string | null;
}

export function AccountListPanel({
  assetClass,
  accounts,
  isaTotals,
  onSelectAccount,
  onBack,
  selectedAccountId,
}: AccountListPanelProps) {
  const { data: settings } = useSettings();
  const wealthThreshold = settings?.stalenessThresholds?.wealth_account ?? 3;
  const createAccount = useCreateAccount();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addBalance, setAddBalance] = useState("");

  const isTrustView = assetClass.startsWith("trust:");
  const trustBeneficiaryName = isTrustView ? assetClass.slice(6) : undefined;
  const baseAssetClass: AssetClass = isTrustView ? "savings" : (assetClass as AssetClass);

  const sorted = [...accounts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isSavings = assetClass === "savings";
  const isaData = isSavings ? (isaTotals ?? null) : null;
  const isaPersons = isaData?.byPerson ?? [];
  const annualLimit = isaData?.annualLimit ?? 20000;

  const heading = isTrustView ? trustBeneficiaryName! : (CLASS_LABELS[assetClass] ?? assetClass);

  function openAddForm() {
    setAddName("");
    setAddBalance("");
    setShowAddForm(true);
  }

  function handleAddAccount() {
    if (!addName.trim()) return;
    createAccount.mutate(
      {
        name: addName.trim(),
        assetClass: baseAssetClass,
        balance: addBalance !== "" ? parseFloat(addBalance) : 0,
        isTrust: isTrustView,
        trustBeneficiaryName,
      },
      {
        onSuccess: () => {
          setShowAddForm(false);
          toast.success("Account added");
        },
        onError: () => {
          toast.error("Couldn't add account — try again");
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← All classes
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{heading}</span>
      </div>

      {/* Add account button / inline form */}
      {showAddForm ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="add-account-name">
              Name
            </label>
            <input
              id="add-account-name"
              autoFocus
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
              placeholder="e.g. Joint savings account"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="add-account-balance">
              Opening balance (£)
            </label>
            <input
              id="add-account-balance"
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded border px-3 py-1.5 text-sm bg-background focus:outline-none focus:border-primary"
              value={addBalance}
              onChange={(e) => setAddBalance(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddAccount}
              disabled={!addName.trim() || createAccount.isPending}
            >
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={openAddForm} className="text-sm">
            + Add account
          </Button>
        </div>
      )}

      {/* ISA Allowance */}
      {isSavings && isaPersons.length > 0 && (
        <div className="space-y-3 rounded-lg border p-3">
          {isaPersons.map((person) => {
            const pct = Math.min(100, (person.used / annualLimit) * 100);
            return (
              <div key={person.ownerId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    <GlossaryTermMarker entryId="isa-allowance">ISA Allowance</GlossaryTermMarker>
                    {" — "}
                    {person.name}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(person.used)} used of {formatCurrency(annualLimit)}
                </p>
              </div>
            );
          })}
          {isaData?.taxYearEnd && (
            <p className="text-xs text-muted-foreground">
              Deadline: {format(new Date(isaData.taxYearEnd), "d MMMM yyyy")}
            </p>
          )}
        </div>
      )}

      {/* Account List */}
      <div className="space-y-0.5">
        {sorted.length === 0 && !showAddForm && (
          <GhostedListEmpty
            ctaHeading="What accounts do you have?"
            ctaText="Add your first account to begin tracking balances"
            onCtaClick={openAddForm}
          />
        )}
        {sorted.map((account) => {
          const isSelected = account.id === selectedAccountId;
          return (
            <button
              key={account.id}
              type="button"
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors hover:bg-accent text-left",
                isSelected && "bg-accent"
              )}
              onClick={() => onSelectAccount(account)}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{account.name}</p>
                {account.provider && (
                  <p className="text-xs text-muted-foreground truncate">{account.provider}</p>
                )}
                {isSavings && account.interestRate != null && (
                  <p className="text-xs text-muted-foreground">{account.interestRate}% p.a.</p>
                )}
                {account.lastReviewedAt && (
                  <StalenessIndicator
                    lastReviewedAt={account.lastReviewedAt as string}
                    thresholdMonths={wealthThreshold}
                  />
                )}
              </div>
              <span className="font-bold ml-4 shrink-0">
                {formatCurrency(account.balance ?? 0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
