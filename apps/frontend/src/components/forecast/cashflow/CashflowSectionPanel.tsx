import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInMonths } from "date-fns";
import type { CashflowProjectionMonth } from "@finplan/shared";
import { useCashflowProjection, useCashflowMonth } from "@/hooks/useCashflow";
import { usePrefersReducedMotion } from "@/utils/motion";
import { CashflowHeader } from "./CashflowHeader";
import { CashflowStaleBanner } from "./CashflowStaleBanner";
import { CashflowEmptyCallout } from "./CashflowEmptyCallout";
import { CashflowYearView } from "./CashflowYearView";
import { CashflowMonthView } from "./CashflowMonthView";

type View = { kind: "year" } | { kind: "month"; year: number; month: number };

export function CashflowSectionPanel() {
  const [view, setView] = useState<View>({ kind: "year" });
  const [windowOffset, setWindowOffset] = useState(0); // months from today
  const reduced = usePrefersReducedMotion();

  const today = new Date();
  const startMonth = ((today.getMonth() + windowOffset) % 12) + 1;
  const startYear = today.getFullYear() + Math.floor((today.getMonth() + windowOffset) / 12);

  // Inclusive bounds of the projection window: current calendar month → +23 months.
  const windowStart = { year: today.getFullYear(), month: today.getMonth() + 1 };
  const windowEndMonthIdx = today.getMonth() + 23;
  const windowEnd = {
    year: today.getFullYear() + Math.floor(windowEndMonthIdx / 12),
    month: (windowEndMonthIdx % 12) + 1,
  };

  const { data: projection, isLoading } = useCashflowProjection({
    monthCount: 12,
    startYear,
    startMonth,
  });

  const monthQuery = useCashflowMonth(
    view.kind === "month" ? view.year : 0,
    view.kind === "month" ? view.month : 0,
    view.kind === "month"
  );

  const slide = {
    initial: (dir: number) => ({ x: reduced ? 0 : dir * 24, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.18, ease: [0.25, 1, 0.5, 1] } },
    exit: (dir: number) => ({
      x: reduced ? 0 : -dir * 24,
      opacity: 0,
      transition: { duration: 0.15 },
    }),
  };

  if (isLoading || !projection) {
    return (
      <div className="flex flex-col h-full">
        <CashflowHeader startingBalance={0} linkedCount={0} oldestBalanceDate={null} />
        <div className="p-4">
          <div className="h-64 bg-card border border-border rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  const oldestMonths = projection.oldestLinkedBalanceDate
    ? differenceInMonths(today, new Date(projection.oldestLinkedBalanceDate))
    : 0;
  const youngestMonths = projection.youngestLinkedBalanceDate
    ? differenceInMonths(today, new Date(projection.youngestLinkedBalanceDate))
    : 0;
  const showStale = oldestMonths >= 1 && projection.linkedAccountCount > 0;

  const amberMonths = new Set(projection.months.filter((m) => m.dipBelowZero).map((m) => m.month));

  function selectMonth(m: CashflowProjectionMonth) {
    setView({ kind: "month", year: m.year, month: m.month });
  }

  return (
    <div className="flex flex-col h-full">
      <CashflowHeader
        startingBalance={projection.latestKnownBalance}
        linkedCount={projection.linkedAccountCount}
      />
      <div className="flex flex-col gap-4 p-4">
        {showStale && (
          <CashflowStaleBanner
            oldestMonths={oldestMonths}
            youngestMonths={youngestMonths}
            onRefresh={() => {}}
          />
        )}
        {projection.linkedAccountCount === 0 && <CashflowEmptyCallout variant="no-accounts" />}

        <AnimatePresence mode="wait" custom={view.kind === "year" ? -1 : 1}>
          {view.kind === "year" && (
            <motion.div
              key="year"
              custom={-1}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <CashflowYearView
                projection={projection}
                onSelectMonth={selectMonth}
                onShiftWindow={(d) => {
                  if (d === 0) {
                    setWindowOffset(0);
                    setView({ kind: "year" });
                  } else {
                    setWindowOffset(windowOffset + d);
                  }
                }}
                canShiftBack={windowOffset > 0}
              />
            </motion.div>
          )}
          {view.kind === "month" && monthQuery.data && (
            <motion.div
              key={`month-${view.year}-${view.month}`}
              custom={1}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <CashflowMonthView
                detail={monthQuery.data}
                amberMonths={amberMonths}
                windowStart={windowStart}
                windowEnd={windowEnd}
                onBack={() => setView({ kind: "year" })}
                onSelectMonth={(m) => setView({ kind: "month", year: view.year, month: m })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
