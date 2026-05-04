import { NavLink } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";
import type { RetirementMemberProjection } from "@finplan/shared";

interface RetirementMemberCardProps {
  member: RetirementMemberProjection;
  horizonEndYear: number;
}

const BREAKDOWN_COLOURS = {
  pension: "#8b5cf6",
  savings: "#6366f1",
  stocksAndShares: "#0ea5e9",
} as const;

export function RetirementMemberCard({ member, horizonEndYear }: RetirementMemberCardProps) {
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  const last = member.series[member.series.length - 1];
  const statPoint =
    member.retirementYear != null
      ? (member.series.find((s) => s.year === member.retirementYear) ?? last)
      : last;

  const retirementLabel =
    member.retirementYear != null && member.retirementYear <= horizonEndYear
      ? `At retirement (${member.retirementYear})`
      : `At ${horizonEndYear}`;

  const total = statPoint ? statPoint.pension + statPoint.savings + statPoint.stocksAndShares : 0;

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          {member.memberName}
        </h3>
        {member.retirementYear != null && (
          <span className="text-xs text-text-tertiary">{retirementLabel}</span>
        )}
      </div>

      {member.retirementYear == null ? (
        <p className="text-sm text-text-tertiary">
          Set {member.memberName}&apos;s retirement year in{" "}
          <NavLink to="/settings" className="underline text-page-accent">
            Settings
          </NavLink>{" "}
          to see their projection
        </p>
      ) : (
        <>
          <p className="font-numeric text-2xl font-semibold text-text-primary tabular-nums">
            {formatCurrency(total, showPence)}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {(
              [
                { key: "pension", label: "Pension" },
                { key: "savings", label: "Savings" },
                { key: "stocksAndShares", label: "S&S" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: BREAKDOWN_COLOURS[key] }}
                />
                <span className="text-xs text-text-tertiary">{label}</span>
                {statPoint && (
                  <span className="font-numeric text-xs text-text-secondary tabular-nums">
                    {formatCurrency(statPoint[key], showPence)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
