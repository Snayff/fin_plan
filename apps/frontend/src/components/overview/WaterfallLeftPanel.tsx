import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { WaterfallSummary } from "@finplan/shared";
import { usePrefersReducedMotion } from "@/utils/motion";
import { formatCurrency } from "@/utils/format";
import { AnimatedCurrency } from "@/components/common/AnimatedCurrency";
import { cn } from "@/lib/utils";
import { isStale } from "@/utils/staleness";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";
import { useSettings } from "@/hooks/useSettings";
import { WaterfallConnector } from "@/components/overview/WaterfallConnector";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
  wealthAccountId?: string | null;
}

interface WaterfallLeftPanelProps {
  summary: WaterfallSummary;
  onSelectItem: (item: SelectedItem) => void;
  onOpenCashflowCalendar: () => void;
  selectedItemId: string | null;
}

const ROW_CLASS =
  "flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors text-[13px] font-body text-text-secondary";

const AMOUNT_CLASS = "font-numeric text-foreground/60";

function StaleCountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-attention"
      aria-label={`${count} item${count === 1 ? "" : "s"} need review`}
    >
      <span
        className="inline-block h-[5px] w-[5px] rounded-full shrink-0 bg-attention"
        aria-hidden
      />
      {count} stale
    </span>
  );
}

function SectionHeader({
  label,
  total,
  colorClass,
  staleCount,
  onHeaderClick,
  headerTestId,
}: {
  label: React.ReactNode;
  total: React.ReactNode;
  colorClass: string;
  staleCount: number;
  onHeaderClick?: () => void;
  headerTestId?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-1.5 px-2">
      <div className="flex items-center gap-2">
        <h3
          className={cn(
            "text-[13px] font-heading font-semibold tracking-tier uppercase",
            colorClass
          )}
        >
          {label}
        </h3>
        <StaleCountBadge count={staleCount} />
      </div>
      <span className={cn("text-[15px] font-numeric font-semibold", colorClass)}>{total}</span>
    </div>
  );

  if (onHeaderClick) {
    return (
      <button
        type="button"
        data-testid={headerTestId}
        onClick={onHeaderClick}
        className="w-full text-left rounded hover:bg-accent/50 transition-colors"
      >
        {content}
      </button>
    );
  }
  return content;
}

export function WaterfallLeftPanel({
  summary,
  onSelectItem,
  onOpenCashflowCalendar,
  selectedItemId: _selectedItemId,
}: WaterfallLeftPanelProps) {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const thresholds = settings?.stalenessThresholds ?? {
    income_source: 12,
    committed_bill: 6,
    yearly_bill: 12,
    discretionary_category: 12,
    savings_allocation: 12,
    wealth_account: 3,
  };

  const { income, committed, discretionary, surplus } = summary;

  const isSubStale = (oldestReviewedAt: Date | null, thresholdMonths: number) =>
    oldestReviewedAt ? isStale(oldestReviewedAt, thresholdMonths) : false;

  const incomeStaleCount = income.bySubcategory.filter((s) =>
    isSubStale(s.oldestReviewedAt, thresholds.income_source ?? 12)
  ).length;

  const committedStaleCount = committed.bySubcategory.filter((s) =>
    isSubStale(s.oldestReviewedAt, thresholds.committed_bill ?? 6)
  ).length;

  const discretionaryStaleCount = discretionary.bySubcategory.filter((s) =>
    isSubStale(s.oldestReviewedAt, thresholds.discretionary_category ?? 12)
  ).length;

  const surplusBenchmark = settings?.surplusBenchmarkPct ?? 10;

  const reduced = usePrefersReducedMotion();

  const containerVariants = {
    animate: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
  };

  return (
    <motion.div
      className="space-y-4 p-4 text-sm"
      variants={containerVariants}
      initial={reduced ? false : "initial"}
      animate="animate"
    >
      {/* INCOME */}
      <motion.div variants={itemVariants}>
        <SectionHeader
          label={<GlossaryTermMarker entryId="net-income">Income</GlossaryTermMarker>}
          total={<AnimatedCurrency value={income.total} />}
          colorClass="text-tier-income"
          staleCount={incomeStaleCount}
          onHeaderClick={() => navigate("/income")}
          headerTestId="tier-heading-income"
        />
        <div className="space-y-0.5">
          {income.bySubcategory.map((sub) => {
            const handleClick = () => navigate(`/income?subcategory=${sub.id}`);
            return (
              <div
                key={sub.id}
                role="button"
                tabIndex={0}
                className={ROW_CLASS}
                onClick={handleClick}
                onKeyDown={(e) => e.key === "Enter" && handleClick()}
              >
                <div className="flex items-center gap-2">
                  <span>{sub.name}</span>
                  {isSubStale(sub.oldestReviewedAt, thresholds.income_source ?? 12) && (
                    <StalenessIndicator
                      lastReviewedAt={sub.oldestReviewedAt!}
                      thresholdMonths={thresholds.income_source ?? 12}
                    />
                  )}
                </div>
                <span className={AMOUNT_CLASS}>{formatCurrency(sub.monthlyTotal)}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <WaterfallConnector text="minus committed" />
      </motion.div>

      {/* COMMITTED */}
      <motion.div variants={itemVariants}>
        <SectionHeader
          label={<GlossaryTermMarker entryId="committed-spend">Committed</GlossaryTermMarker>}
          total={<AnimatedCurrency value={committed.monthlyTotal + committed.monthlyAvg12} />}
          colorClass="text-tier-committed"
          staleCount={committedStaleCount}
          onHeaderClick={() => navigate("/committed")}
          headerTestId="tier-heading-committed"
        />
        <div className="space-y-0.5">
          {committed.bySubcategory.map((sub) => {
            const handleClick = () => navigate(`/committed?subcategory=${sub.id}`);
            return (
              <div
                key={sub.id}
                role="button"
                tabIndex={0}
                className={ROW_CLASS}
                onClick={handleClick}
                onKeyDown={(e) => e.key === "Enter" && handleClick()}
              >
                <div className="flex items-center gap-2">
                  <span>{sub.name}</span>
                  {isSubStale(sub.oldestReviewedAt, thresholds.committed_bill ?? 6) && (
                    <StalenessIndicator
                      lastReviewedAt={sub.oldestReviewedAt!}
                      thresholdMonths={thresholds.committed_bill ?? 6}
                    />
                  )}
                </div>
                <span className={AMOUNT_CLASS}>{formatCurrency(sub.monthlyTotal)}</span>
              </div>
            );
          })}
          {committed.monthlyAvg12 > 0 && (
            <button
              type="button"
              className={cn(ROW_CLASS, "text-muted-foreground text-xs hover:text-foreground")}
              onClick={() => onOpenCashflowCalendar()}
            >
              <span>incl. yearly ÷12</span>
              <span className={AMOUNT_CLASS}>{formatCurrency(committed.monthlyAvg12)}</span>
            </button>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <WaterfallConnector text="minus discretionary" />
      </motion.div>

      {/* DISCRETIONARY */}
      <motion.div variants={itemVariants}>
        <SectionHeader
          label={
            <GlossaryTermMarker entryId="discretionary-spend">Discretionary</GlossaryTermMarker>
          }
          total={<AnimatedCurrency value={discretionary.total} />}
          colorClass="text-tier-discretionary"
          staleCount={discretionaryStaleCount}
          onHeaderClick={() => navigate("/discretionary")}
          headerTestId="tier-heading-discretionary"
        />
        <div className="space-y-0.5">
          {discretionary.bySubcategory.map((sub) => {
            const handleClick = () => navigate(`/discretionary?subcategory=${sub.id}`);
            return (
              <div
                key={sub.id}
                role="button"
                tabIndex={0}
                className={ROW_CLASS}
                onClick={handleClick}
                onKeyDown={(e) => e.key === "Enter" && handleClick()}
              >
                <div className="flex items-center gap-2">
                  <span>{sub.name}</span>
                  {isSubStale(sub.oldestReviewedAt, thresholds.discretionary_category ?? 12) && (
                    <StalenessIndicator
                      lastReviewedAt={sub.oldestReviewedAt!}
                      thresholdMonths={thresholds.discretionary_category ?? 12}
                    />
                  )}
                </div>
                <span className={AMOUNT_CLASS}>{formatCurrency(sub.monthlyTotal)}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <WaterfallConnector text="equals" />
      </motion.div>

      {/* SURPLUS */}
      <motion.div variants={itemVariants} className="relative">
        {surplus.amount > 0 && !reduced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut", times: [0, 0.2, 1] }}
            className="absolute inset-0 pointer-events-none rounded"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, hsl(175 72% 57% / 0.09) 0%, transparent 70%)",
            }}
          />
        )}
        <SectionHeader
          label={<GlossaryTermMarker entryId="surplus">Surplus</GlossaryTermMarker>}
          total={<AnimatedCurrency value={surplus.amount} />}
          colorClass="text-tier-surplus"
          staleCount={0}
          onHeaderClick={() => navigate("/surplus")}
          headerTestId="tier-heading-surplus"
        />
        <div aria-live="polite" aria-atomic="true">
          {income.total > 0 && surplus.percentOfIncome < surplusBenchmark && (
            <div className="flex items-center gap-1.5 px-2 text-xs text-attention">
              <span className="h-[5px] w-[5px] rounded-full shrink-0 bg-attention" aria-hidden />
              <span>Below benchmark</span>
            </div>
          )}
        </div>
        {discretionary.savings.allocations.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const first = discretionary.savings.allocations[0];
              if (first) {
                onSelectItem({
                  id: first.id,
                  type: "savings_allocation",
                  name: first.name,
                  amount: first.monthlyAmount,
                  lastReviewedAt: new Date(first.lastReviewedAt),
                });
              }
            }}
            className="px-2 py-2 text-xs text-primary hover:underline min-h-[44px] flex items-center"
          >
            Increase savings ▸
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
