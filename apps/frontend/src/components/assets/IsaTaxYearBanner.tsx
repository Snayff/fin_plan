import { formatCurrency } from "@/utils/format";

interface Props {
  account: {
    id: string;
    type: "Savings" | "Current" | "Pension" | "StocksAndShares" | "Other";
    isISA: boolean;
    isaYearContribution: number | null;
    updatedAt: string | Date;
    memberId: string | null;
  };
  today?: Date;
  onZero: () => void;
  showPence: boolean;
}

function mostRecent6April(today: Date): Date {
  const y = today.getUTCFullYear();
  const thisYearStart = new Date(Date.UTC(y, 3, 6));
  return today.getTime() >= thisYearStart.getTime()
    ? thisYearStart
    : new Date(Date.UTC(y - 1, 3, 6));
}

export function IsaTaxYearBanner({ account, today = new Date(), onZero, showPence }: Props) {
  if (account.type !== "Savings" || !account.isISA) return null;
  const contrib = account.isaYearContribution ?? 0;
  if (contrib <= 0) return null;

  const boundary = mostRecent6April(today);
  if (today.getTime() < boundary.getTime()) return null;

  const updated = new Date(account.updatedAt);
  if (updated.getTime() >= boundary.getTime()) return null;

  return (
    <div
      data-testid="isa-tax-year-banner"
      className="rounded-md border border-attention/20 bg-attention/[0.05] px-3 py-2 text-xs text-text-secondary"
    >
      <p>
        A new tax year began on 6 April. Last year&apos;s contribution was{" "}
        <strong className="text-foreground">{formatCurrency(contrib, showPence)}</strong> — zero it
        to start tracking this year.
      </p>
      <button
        type="button"
        onClick={onZero}
        className="mt-2 rounded-md border border-attention/30 bg-attention/10 px-2.5 py-1 text-[11px] font-medium text-attention hover:bg-attention/20 transition-colors"
      >
        Zero this year&apos;s contribution
      </button>
    </div>
  );
}
