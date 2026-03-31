import { format } from "date-fns";
import { formatCurrency } from "@/utils/format";
import { useCashflow } from "@/hooks/useWaterfall";
import type { CashflowMonth } from "@finplan/shared";

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
  _itemId: string,
  itemType: string,
  isReadOnly: boolean
): NudgeContent | null {
  if (itemType !== "savings_allocation" || isReadOnly) return null;

  // Account-level rate nudges will be re-implemented against the new Assets system in Task 8
  return null;
}

// ─── Hook 3: Account nudge ────────────────────────────────────────────────────

// Placeholder — will be re-implemented against the new Assets system in Task 8
export function useWealthAccountNudge(_account: any): NudgeContent | null {
  return null;
}
