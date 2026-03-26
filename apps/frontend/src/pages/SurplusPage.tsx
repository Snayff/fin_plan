import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

const SURPLUS_BENCHMARK_PCT = 10;

export default function SurplusPage() {
  const { data, isLoading } = useWaterfallSummary();

  const income = data?.income.total ?? 0;
  const committed = (data?.committed.monthlyTotal ?? 0) + (data?.committed.monthlyAvg12 ?? 0);
  const discretionary = (data?.discretionary.total ?? 0) + (data?.discretionary.savings.total ?? 0);
  const surplus = data?.surplus.amount ?? income - committed - discretionary;
  const surplusPct = data?.surplus.percentOfIncome ?? (income > 0 ? (surplus / income) * 100 : 0);
  const showBenchmarkWarning = !isLoading && surplus < (income * SURPLUS_BENCHMARK_PCT) / 100;

  return (
    <div data-testid="surplus-page" className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(20,184,166,0.08) 0%, transparent 70%)",
        }}
      />
      <TwoPanelLayout
        left={
          <div className="flex flex-col gap-6 p-6">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Surplus</h1>
            {!isLoading && (
              <>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Income</span>
                    <span className="font-numeric text-tier-income">
                      {formatCurrency(toGBP(income))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Committed</span>
                    <span className="font-numeric text-tier-committed">
                      − {formatCurrency(toGBP(committed))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Discretionary</span>
                    <span className="font-numeric text-tier-discretionary">
                      − {formatCurrency(toGBP(discretionary))}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-foreground/10 pt-2 flex justify-between font-semibold">
                    <span className="text-foreground">Surplus</span>
                    <span className="font-numeric text-tier-surplus text-lg">
                      {formatCurrency(toGBP(surplus))}
                    </span>
                  </div>
                </div>
                {showBenchmarkWarning && (
                  <div
                    data-testid="surplus-benchmark-warning"
                    className="flex items-start gap-2 rounded-lg border border-attention/20 bg-attention/5 p-3 text-xs text-attention"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-attention" />
                    <span>
                      Your surplus is below your {SURPLUS_BENCHMARK_PCT}% benchmark. A monthly
                      surplus of around {SURPLUS_BENCHMARK_PCT}% of income is a common planning
                      benchmark.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        }
        right={
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            {!isLoading && (
              <>
                <p className="text-sm text-foreground/50">
                  At the end of each month, you should have
                </p>
                <p className="font-numeric text-4xl font-bold text-tier-surplus">
                  {formatCurrency(toGBP(surplus))}
                </p>
                <p className="text-sm text-foreground/50">left over.</p>
                <p className="mt-1 text-xs text-foreground/30">
                  {surplusPct.toFixed(1)}% surplus rate
                </p>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
