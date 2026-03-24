import { useState } from "react";
import type React from "react";
import type { AssetClass } from "@finplan/shared";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { WealthLeftPanel } from "@/components/wealth/WealthLeftPanel";
import { AccountListPanel } from "@/components/wealth/AccountListPanel";
import { AccountDetailPanel } from "@/components/wealth/AccountDetailPanel";
import { useWealthSummary, useWealthAccounts, useIsaAllowance } from "@/hooks/useWealth";

type RightView =
  | { type: "none" }
  | { type: "list"; assetClass: string }
  | { type: "detail"; account: any };

export default function WealthPage() {
  const [view, setView] = useState<RightView>({ type: "none" });
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: summaryRefetch,
  } = useWealthSummary();
  const { data: accounts = [], isLoading: _accountsLoading } = useWealthAccounts();
  const { data: isaTotals } = useIsaAllowance();

  const left = summaryLoading ? (
    <SkeletonLoader variant="left-panel" />
  ) : summaryError && !summary ? (
    <PanelError variant="left" onRetry={summaryRefetch} message="Could not load wealth summary" />
  ) : summary ? (
    <WealthLeftPanel
      summary={summary}
      accounts={accounts}
      onSelectClass={(cls: AssetClass) => setView({ type: "list", assetClass: cls })}
      onSelectTrust={(name: string) => setView({ type: "list", assetClass: `trust:${name}` })}
      selectedClass={
        view.type === "list"
          ? (view.assetClass as AssetClass | "trust")
          : view.type === "detail"
            ? (view.account.assetClass as AssetClass | "trust")
            : null
      }
      selectedTrustName={null}
    />
  ) : null;

  let right: React.ReactNode | null = null;
  if (view.type === "list") {
    const filteredAccounts = accounts.filter((a: any) =>
      view.assetClass.startsWith("trust:")
        ? a.isTrust && a.trustBeneficiaryName === view.assetClass.slice(6)
        : a.assetClass === view.assetClass && !a.isTrust
    );
    right = (
      <AccountListPanel
        assetClass={view.assetClass}
        accounts={filteredAccounts}
        isaTotals={isaTotals}
        onSelectAccount={(acc: any) => setView({ type: "detail", account: acc })}
        onBack={() => setView({ type: "none" })}
        selectedAccountId={null}
      />
    );
  } else if (view.type === "detail") {
    right = (
      <AccountDetailPanel
        account={view.account}
        onBack={() => setView({ type: "list", assetClass: view.account.assetClass })}
      />
    );
  }

  return (
    <div data-page="wealth" className="relative h-full">
      <TwoPanelLayout left={left ?? <SkeletonLoader variant="left-panel" />} right={right} />
    </div>
  );
}
