import { format } from "date-fns";

interface Period {
  startDate: Date;
  endDate: Date | null;
  amount: number;
}

export function buildChartData(
  periods: Period[],
  now: Date
): Array<{ date: string; value: number }> {
  const sorted = [...periods].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const data: Array<{ date: string; value: number }> = [];

  for (const p of sorted) {
    data.push({ date: format(p.startDate, "yyyy-MM-dd"), value: p.amount });

    if (p.endDate) {
      data.push({ date: format(p.endDate, "yyyy-MM-dd"), value: p.amount });
    }
  }

  // Extend to now if the last period is open-ended and has already started.
  // Skipped when the last period is scheduled for the future (startDate > now),
  // otherwise we'd plot a point dated before the period's own start.
  const last = sorted[sorted.length - 1];
  if (last && !last.endDate && now.getTime() > last.startDate.getTime()) {
    data.push({ date: format(now, "yyyy-MM-dd"), value: last.amount });
  }

  return data;
}
