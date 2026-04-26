import type { AccountItem } from "@/services/assets.service";
import { formatCurrency } from "@/utils/format";
import { NudgeCard } from "@/components/common/NudgeCard";

interface Props {
  account: AccountItem;
  showPence: boolean;
}

function fmtRate(pct: number) {
  return `${pct.toFixed(1)}%`;
}

export function SavingsContributionNudge({ account, showPence }: Props) {
  if (account.type !== "Savings" || account.monthlyContributionLimit == null) return null;

  if (account.isOverCap) {
    const monthly = account.monthlyContribution;
    const limit = account.monthlyContributionLimit;
    const over = monthly - limit;
    return (
      <NudgeCard
        message={
          `Linked contributions total ${formatCurrency(monthly, showPence)}/mo — ` +
          `${formatCurrency(over, showPence)} over this account's ${formatCurrency(limit, showPence)}/mo limit. ` +
          `The cap is set on the account; review the linked Discretionary items if this is unintended.`
        }
      />
    );
  }

  if (account.hasSpareCapacityNudge && account.higherRateTarget && account.spareMonthly != null) {
    const spare = account.spareMonthly;
    const target = account.higherRateTarget;
    const myRate = account.growthRatePct ?? 0;
    const annualUplift = Math.round((spare * 12 * (target.growthRatePct - myRate)) / 100);
    return (
      <NudgeCard
        message={
          `${formatCurrency(spare, showPence)}/mo spare on this account. ` +
          `${target.name} pays ${fmtRate(target.growthRatePct)} vs ${fmtRate(myRate)} here — ` +
          `redirecting could earn ~£${annualUplift}/yr more.`
        }
      />
    );
  }

  return null;
}
