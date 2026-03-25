import { format } from "date-fns";
import { formatCurrency } from "@/utils/format";
import { useCashflow, useWaterfallSummary } from "@/hooks/useWaterfall";
import { useWealthAccounts, useIsaAllowance } from "@/hooks/useWealth";
import type { CashflowMonth, SavingsAllocationRow } from "@finplan/shared";

interface NudgeContent {
  message: string;
  options?: string[];
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function buildShortfallNudge(months: CashflowMonth[]): NudgeContent | null {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentYear = now.getFullYear();

  const shortfalls = months
    .filter((m) => m.shortfall)
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));

  // Prefer a future/current month; fall back to any shortfall (e.g. past months in test data)
  const target =
    shortfalls.find(
      (m) => m.year > currentYear || (m.year === currentYear && m.month >= currentMonth)
    ) ?? shortfalls[0];

  if (!target) return null;

  const monthName = format(new Date(target.year, target.month - 1, 1), "MMMM");
  const billCount = target.bills.length;
  const billTotal = target.bills.reduce((s, b) => s + b.amount, 0);
  const pot = target.potAfter; // negative when shortfall

  const monthsFromNow =
    target.year === currentYear
      ? Math.max(1, target.month - currentMonth)
      : Math.max(1, (target.year - currentYear) * 12 + (target.month - currentMonth));

  const x = Math.ceil(Math.abs(pot) / monthsFromNow);

  return {
    message: `${monthName} looks tight — ${billCount} ${billCount === 1 ? "bill" : "bills"} land (${formatCurrency(billTotal)} total). Your pot will have ${formatCurrency(pot)} by then.`,
    options: [
      `Increase your monthly contribution by ${formatCurrency(x)} to cover this`,
      `Draw ${formatCurrency(Math.abs(pot))} from existing savings when the bills fall due`,
    ],
  };
}

// ─── Hook 1: Yearly bill nudge ────────────────────────────────────────────────

export function useYearlyBillNudge(
  itemType: string,
  isReadOnly: boolean
): { nudge: NudgeContent | null } {
  const year = new Date().getFullYear();
  const enabled = itemType === "yearly_bill" && !isReadOnly;
  const { data: months } = useCashflow(year, { enabled });

  if (!enabled || !months) return { nudge: null };
  return { nudge: buildShortfallNudge(months) };
}

// ─── Hook 2: Savings allocation nudge ────────────────────────────────────────

export function useSavingsNudge(
  itemId: string,
  itemType: string,
  isReadOnly: boolean
): NudgeContent | null {
  const { data: summary } = useWaterfallSummary();
  const { data: accounts } = useWealthAccounts();

  if (itemType !== "savings_allocation" || isReadOnly || !summary || !accounts) return null;

  const allocations: SavingsAllocationRow[] = summary.discretionary.savings.allocations;
  const thisAllocation = allocations.find((a) => a.id === itemId);

  if (!thisAllocation?.wealthAccountId) return null;

  const thisAccount = (accounts as any[]).find((a) => a.id === thisAllocation.wealthAccountId);
  if (!thisAccount || thisAccount.interestRate == null) return null;

  const thisRate: number = thisAccount.interestRate;

  // Find the other allocation with the highest monthly amount going to a lower-rate account
  let bestCandidate: { amount: number; rate: number } | null = null;
  for (const alloc of allocations) {
    if (alloc.id === itemId || !alloc.wealthAccountId) continue;
    const linked = (accounts as any[]).find((a) => a.id === alloc.wealthAccountId);
    if (!linked || linked.interestRate == null) continue;
    const rate: number = linked.interestRate;
    if (rate >= thisRate) continue;
    if (!bestCandidate || alloc.monthlyAmount > bestCandidate.amount) {
      bestCandidate = { amount: alloc.monthlyAmount, rate };
    }
  }

  if (!bestCandidate) return null;

  const gain = Math.round(((bestCandidate.amount * (thisRate - bestCandidate.rate)) / 100) * 12);
  if (gain <= 0) return null;

  return {
    message: `Redirecting ${formatCurrency(bestCandidate.amount)}/mo to this account could earn ~${formatCurrency(gain)} more per year`,
  };
}

// ─── Hook 3: Wealth account nudge ────────────────────────────────────────────

export function useWealthAccountNudge(account: any): NudgeContent | null {
  const { data: isaData } = useIsaAllowance();
  const { data: allAccounts } = useWealthAccounts();
  const { data: summary } = useWaterfallSummary();

  if (account?.assetClass !== "savings") return null;

  // ── ISA nudges (priority) ──────────────────────────────────────────────────
  if (account.isISA && Array.isArray(isaData) && isaData.length > 0) {
    const entry = isaData[0]!;
    const personEntry = account.ownerId
      ? entry.byPerson.find((p: any) => p.ownerId === account.ownerId)
      : null;
    const remaining: number =
      personEntry?.remaining ??
      entry.byPerson.reduce((s: number, p: any) => s + (p.remaining as number), 0);

    if (remaining > 0 && remaining <= 2000) {
      const now = new Date();
      const deadlineYear = now.getMonth() < 3 ? now.getFullYear() : now.getFullYear() + 1;
      return {
        message: `${formatCurrency(remaining)} remaining in your ISA allowance — deadline: 5 April ${deadlineYear}`,
      };
    }
    if (remaining > 2000) {
      return {
        message: `${formatCurrency(remaining)} ISA allowance remaining this tax year`,
      };
    }
    // remaining <= 0: at/over limit — no nudge
    return null;
  }

  // ── Higher-rate arbitrage ──────────────────────────────────────────────────
  if (!allAccounts || !summary || account.interestRate == null) return null;

  const thisRate: number = account.interestRate;
  const allocations: SavingsAllocationRow[] = summary.discretionary.savings.allocations;

  let bestCandidate: { amount: number; rate: number } | null = null;
  for (const alloc of allocations) {
    if (!alloc.wealthAccountId || alloc.wealthAccountId === account.id) continue;
    const linked = (allAccounts as any[]).find((a) => a.id === alloc.wealthAccountId);
    if (!linked || linked.interestRate == null) continue;
    const rate: number = linked.interestRate;
    if (rate >= thisRate) continue;
    if (!bestCandidate || alloc.monthlyAmount > bestCandidate.amount) {
      bestCandidate = { amount: alloc.monthlyAmount, rate };
    }
  }

  if (!bestCandidate) return null;

  const gain = Math.round(((bestCandidate.amount * (thisRate - bestCandidate.rate)) / 100) * 12);
  if (gain <= 0) return null;

  return {
    message: `Redirecting ${formatCurrency(bestCandidate.amount)}/mo to this account could earn ~${formatCurrency(gain)} more per year`,
  };
}
