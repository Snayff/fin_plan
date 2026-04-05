import { useMemo } from "react";
import { format } from "date-fns";
import { SummarySparkline } from "@/components/overview/SummarySparkline";

interface Period {
  id: string;
  startDate: Date;
  endDate: Date | null;
  amount: number;
}

interface Props {
  periods: Period[];
  color: string;
  now?: Date;
}

export default function ValueSparkline({ periods, color, now = new Date() }: Props) {
  const chartData = useMemo(() => {
    const sorted = [...periods].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const data: Array<{ date: string; value: number }> = [];

    for (const p of sorted) {
      data.push({
        date: format(p.startDate, "yyyy-MM-dd"),
        value: p.amount,
      });

      if (p.endDate) {
        data.push({
          date: format(p.endDate, "yyyy-MM-dd"),
          value: p.amount,
        });
      }
    }

    // Extend to now if the last period is open-ended
    const last = sorted[sorted.length - 1];
    if (last && !last.endDate) {
      data.push({
        date: format(now, "yyyy-MM-dd"),
        value: last.amount,
      });
    }

    return data;
  }, [periods, now]);

  const currentValue = periods[periods.length - 1]?.amount ?? 0;

  return (
    <div className="mt-3">
      <span className="block text-text-muted uppercase tracking-[0.07em] text-[10px] mb-1.5">
        Value History
      </span>
      <SummarySparkline data={chartData} color={color} currentValue={currentValue} />
    </div>
  );
}
