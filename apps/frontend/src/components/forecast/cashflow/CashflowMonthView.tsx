import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { CashflowMonthDetail } from "@finplan/shared";
import { CashflowEventList } from "./CashflowEventList";

interface CashflowMonthViewProps {
  detail: CashflowMonthDetail;
  amberMonths: Set<number>;
  onBack: () => void;
  onSelectMonth: (month: number) => void;
}

const STRIP = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CashflowMonthView({
  detail,
  amberMonths,
  onBack,
  onSelectMonth,
}: CashflowMonthViewProps) {
  const monthLabel = format(new Date(detail.year, detail.month - 1, 1), "MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-xs text-text-tertiary hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-page-accent rounded px-1"
      >
        ← Cashflow / {monthLabel}
      </button>

      <div className="flex items-center gap-1">
        {STRIP.map((letter, idx) => {
          const m = idx + 1;
          const active = m === detail.month;
          const amber = amberMonths.has(m);
          return (
            <button
              key={`${letter}-${idx}`}
              type="button"
              onClick={() => onSelectMonth(m)}
              aria-label={FULL[idx]}
              aria-current={active ? "true" : undefined}
              className={cn(
                "w-7 h-7 rounded text-[10px] font-heading uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-page-accent",
                active && "bg-page-accent text-background",
                !active && amber && "bg-attention/20 text-attention",
                !active && !amber && "text-text-tertiary hover:text-foreground"
              )}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Starting balance" value={formatCurrency(detail.startingBalance)} />
        <StatCard label="End balance" value={formatCurrency(detail.endBalance)} />
        <StatCard
          label="Tightest point"
          value={formatCurrency(detail.tightestPoint.value)}
          amber={detail.tightestPoint.value < 0}
        />
        <StatCard label="Net change" value={formatCurrency(detail.netChange)} />
      </div>

      <div className="rounded bg-surface border border-surface-border px-3 py-2 text-xs text-text-tertiary">
        Discretionary {formatCurrency(detail.monthlyDiscretionaryTotal)}/mo amortised evenly across
        the month
      </div>

      <div className="rounded-md border border-surface-border bg-surface p-4 h-56">
        <StepLineChart trace={detail.dailyTrace} events={detail.events} />
      </div>

      <CashflowEventList events={detail.events} />
    </div>
  );
}

function StatCard({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div className="rounded-md border border-surface-border bg-surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary font-heading">
        {label}
      </div>
      <div
        className={cn("font-numeric text-base mt-1", amber ? "text-attention" : "text-foreground")}
      >
        {value}
      </div>
    </div>
  );
}

function StepLineChart({
  trace,
  events,
}: {
  trace: Array<{ day: number; balance: number }>;
  events: Array<{ date: string }>;
}) {
  if (trace.length === 0) return null;
  const min = Math.min(...trace.map((p) => p.balance));
  const max = Math.max(...trace.map((p) => p.balance));
  const range = Math.max(1, max - min);
  const days = trace.length;
  const points = trace
    .map((p, i) => `${(i / (days - 1)) * 100},${100 - ((p.balance - min) / range) * 100}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
      role="img"
      aria-label="Daily projected balance trace. Detailed values are listed in the events below."
    >
      <title>Daily projected balance — see event list for exact values</title>
      <polyline points={points} fill="none" stroke="hsl(var(--page-accent))" strokeWidth="0.6" />
      {events.map((e, i) => {
        const day = parseInt(e.date.slice(8, 10), 10);
        const x = ((day - 1) / (days - 1)) * 100;
        return <circle key={i} cx={x} cy={50} r="0.8" fill="hsl(var(--page-accent))" />;
      })}
    </svg>
  );
}
