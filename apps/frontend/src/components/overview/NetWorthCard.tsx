import { Link } from "react-router-dom";
import type { SparklinePoint } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";
import { SummarySparkline } from "./SummarySparkline";

interface NetWorthCardProps {
  netWorth: number | null;
  sparklineData: SparklinePoint[];
}

const SHELL_STYLE = {
  background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)",
  border: "1px solid rgba(99,102,241,0.1)",
} as const;

const LABEL_STYLE = {
  color: "rgba(238,242,255,0.65)",
  fontSize: "13px",
  fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
  fontWeight: 600,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
};

export function NetWorthCard({ netWorth, sparklineData }: NetWorthCardProps) {
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  if (netWorth === null) {
    return (
      <div className="rounded-xl pt-5 pb-4 px-4 overflow-hidden" style={SHELL_STYLE}>
        <p className="text-center mb-3" style={LABEL_STYLE}>
          NET WORTH
        </p>
        <div className="flex flex-col items-center text-center">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-1">
            Track your wealth over time
          </h3>
          <p className="text-xs text-text-tertiary mb-3 max-w-xs">
            Add a savings, investment or pension account to see your net worth.
          </p>
          <Link
            to="/assets"
            className="inline-block rounded-md bg-page-accent/15 border border-page-accent/40 px-3 py-1.5 text-xs font-medium text-page-accent hover:bg-page-accent/25 transition-colors"
          >
            Add wealth account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl pt-5 pb-4 overflow-hidden" style={SHELL_STYLE}>
      <p className="text-center mb-2" style={LABEL_STYLE}>
        NET WORTH
      </p>
      <p
        className="text-center tabular-nums"
        style={{
          color: "rgba(238,242,255,0.92)",
          fontSize: "36px",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          lineHeight: 1.1,
        }}
      >
        {formatCurrency(netWorth, showPence)}
      </p>
      <div className="mt-3">
        <SummarySparkline
          data={sparklineData}
          color="#818cf8"
          currentValue={netWorth}
          paddingX={0}
        />
      </div>
    </div>
  );
}
