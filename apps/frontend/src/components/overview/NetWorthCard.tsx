import type { SparklinePoint } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";
import { SummarySparkline } from "./SummarySparkline";

interface NetWorthCardProps {
  netWorth: number | null;
  sparklineData: SparklinePoint[];
}

export function NetWorthCard({ netWorth, sparklineData }: NetWorthCardProps) {
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;
  return (
    <div
      className="rounded-xl pt-5 pb-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)",
        border: "1px solid rgba(99,102,241,0.1)",
      }}
    >
      <p
        className="text-center mb-2"
        style={{
          color: "rgba(238,242,255,0.65)",
          fontSize: "13px",
          fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          fontWeight: 600,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
        }}
      >
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
        {netWorth !== null ? formatCurrency(netWorth, showPence) : "£\u2014"}
      </p>
      {netWorth !== null && (
        <div className="mt-3">
          <SummarySparkline
            data={sparklineData}
            color="#818cf8"
            currentValue={netWorth}
            paddingX={0}
          />
        </div>
      )}
    </div>
  );
}
