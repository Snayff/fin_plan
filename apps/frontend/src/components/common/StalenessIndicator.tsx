import { isStale, stalenessLabel, monthsElapsed } from "@/utils/staleness";

interface StalenessIndicatorProps {
  lastReviewedAt: Date | string;
  thresholdMonths: number;
}

export function StalenessIndicator({ lastReviewedAt, thresholdMonths }: StalenessIndicatorProps) {
  if (!isStale(lastReviewedAt, thresholdMonths)) return null;

  const months = monthsElapsed(lastReviewedAt);
  const label = stalenessLabel(lastReviewedAt);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-500" title={label}>
      <span className="inline-block h-[5px] w-[5px] rounded-full bg-amber-500 shrink-0" />
      {months}mo ago
    </span>
  );
}
