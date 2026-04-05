import { useMemo } from "react";

interface Period {
  id: string;
  startDate: Date;
  endDate: Date | null;
  amount: number;
}

interface Props {
  periods: Period[];
  tierColorClass: string;
  now?: Date;
}

const SVG_WIDTH = 500;
const SVG_HEIGHT = 48;
const PADDING_Y = 8;

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ValueSparkline({ periods, tierColorClass, now = new Date() }: Props) {
  const { points, nowX, labels } = useMemo(() => {
    if (periods.length <= 1) {
      return { points: [], nowX: 0, labels: [] };
    }

    const sorted = [...periods].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const minTime = sorted[0]!.startDate.getTime();
    const lastPeriodEnd = sorted[sorted.length - 1]!.endDate;
    const maxTime = Math.max(
      now.getTime(),
      lastPeriodEnd?.getTime() ?? now.getTime() + 90 * 24 * 60 * 60 * 1000
    );
    const timeRange = maxTime - minTime || 1;

    const amounts = sorted.map((p) => p.amount);
    const minAmt = Math.min(...amounts);
    const maxAmt = Math.max(...amounts);
    const amtRange = maxAmt - minAmt || 1;

    function xForTime(t: number): number {
      return ((t - minTime) / timeRange) * SVG_WIDTH;
    }

    function yForAmount(a: number): number {
      return SVG_HEIGHT - PADDING_Y - ((a - minAmt) / amtRange) * (SVG_HEIGHT - PADDING_Y * 2);
    }

    const pts: Array<{ x: number; y: number; future: boolean }> = [];
    const lbls: Array<{ x: number; y: number; text: string }> = [];

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i]!;
      const x = xForTime(p.startDate.getTime());
      const y = yForAmount(p.amount);
      const isFuture = p.startDate > now;

      if (i > 0) {
        const prev = pts[pts.length - 1];
        if (prev) pts.push({ x, y: prev.y, future: isFuture });
      }
      pts.push({ x, y, future: isFuture });

      if (i === sorted.length - 1) {
        const endX = p.endDate ? xForTime(p.endDate.getTime()) : SVG_WIDTH;
        pts.push({ x: endX, y, future: isFuture });
      }

      lbls.push({
        x: x + 4,
        y: y - 4,
        text: formatCompact(p.amount),
      });
    }

    return {
      points: pts,
      nowX: xForTime(now.getTime()),
      labels: lbls,
    };
  }, [periods, now]);

  if (points.length === 0) return null;

  const pastPoints = points.filter((p) => !p.future);
  const futurePoints = points.filter((p) => p.future);
  if (pastPoints.length > 0 && futurePoints.length > 0) {
    const lastPast = pastPoints[pastPoints.length - 1];
    if (lastPast) futurePoints.unshift(lastPast);
  }

  const tierColor = tierColorClass.replace("text-", "");

  return (
    <div className="mt-3">
      <span className="block text-text-muted uppercase tracking-[0.07em] text-[10px] mb-1.5">
        Value History
      </span>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-12"
        role="img"
        aria-label="Value history sparkline"
      >
        {pastPoints.length > 1 && (
          <polyline
            points={pastPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            className={`stroke-${tierColor}`}
            strokeWidth="1.5"
            opacity="0.6"
          />
        )}
        {futurePoints.length > 1 && (
          <polyline
            points={futurePoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            className={`stroke-${tierColor}`}
            strokeWidth="1.5"
            opacity="0.4"
            strokeDasharray="4 3"
          />
        )}
        {pastPoints.length > 0 && (
          <circle
            cx={nowX}
            cy={pastPoints[pastPoints.length - 1]?.y}
            r="3"
            className={`fill-${tierColor}`}
            opacity="0.8"
          />
        )}
        {labels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={lbl.y}
            className="fill-text-tertiary font-numeric"
            fontSize="9"
          >
            {lbl.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
