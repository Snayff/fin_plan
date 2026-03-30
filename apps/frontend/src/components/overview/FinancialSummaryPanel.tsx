import { motion, useReducedMotion } from "framer-motion";
import { useFinancialSummary } from "@/hooks/useWaterfall";
import { NetWorthCard } from "./NetWorthCard";
import { TierSummaryCard } from "./TierSummaryCard";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] as const },
  },
};

const cardVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

function SkeletonCard({ large = false }: { large?: boolean }) {
  return (
    <div
      className="rounded-xl p-6 animate-pulse"
      style={{ background: "#0d1120", border: "1px solid #1a1f35" }}
    >
      <div className="h-3 w-20 rounded bg-white/10 mx-auto mb-3" />
      <div className={`${large ? "h-9 w-32" : "h-5 w-24"} rounded bg-white/10 mx-auto mb-3`} />
      <div className="h-10 w-full rounded bg-white/10" />
    </div>
  );
}

export function FinancialSummaryPanel() {
  const shouldReduce = useReducedMotion();
  const { data, isLoading, isError, refetch } = useFinancialSummary();

  const cv = shouldReduce ? cardVariantsReduced : cardVariants;

  if (isLoading) {
    return (
      <div
        data-testid="financial-summary-panel"
        role="status"
        aria-busy="true"
        aria-label="Loading financial summary"
        className="flex flex-col items-center justify-start h-full overflow-y-auto py-8"
      >
        <div className="flex flex-col gap-3 w-[62%]">
          <SkeletonCard large />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        data-testid="financial-summary-panel"
        className="flex h-full items-center justify-center"
      >
        <div className="text-center">
          <p className="text-sm text-foreground/40 mb-2">Could not load summary</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs text-foreground/30 hover:text-foreground/50 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      data-testid="financial-summary-panel"
      className="flex flex-col items-center justify-start h-full overflow-y-auto py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-3 w-[62%]">
        <motion.div variants={cv}>
          <NetWorthCard netWorth={data.current.netWorth} sparklineData={data.sparklines.netWorth} />
        </motion.div>
        <motion.div variants={cv}>
          <TierSummaryCard
            tier="income"
            amount={data.current.income}
            sparklineData={data.sparklines.income}
          />
        </motion.div>
        <motion.div variants={cv}>
          <TierSummaryCard
            tier="committed"
            amount={data.current.committed}
            sparklineData={data.sparklines.committed}
          />
        </motion.div>
        <motion.div variants={cv}>
          <TierSummaryCard
            tier="discretionary"
            amount={data.current.discretionary}
            sparklineData={data.sparklines.discretionary}
          />
        </motion.div>
        <motion.div variants={cv}>
          <TierSummaryCard
            tier="surplus"
            amount={data.current.surplus}
            sparklineData={data.sparklines.surplus}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
