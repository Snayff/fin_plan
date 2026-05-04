import type { RetirementMemberProjection } from "@finplan/shared";
import { RetirementMemberCard } from "./RetirementMemberCard";
import { cn } from "@/lib/utils";

interface RetirementSummaryProps {
  members: RetirementMemberProjection[];
  horizonEndYear: number;
}

const GRID_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function RetirementSummary({ members, horizonEndYear }: RetirementSummaryProps) {
  if (members.length === 0) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-xl p-5">
        <span className="label-chart">Retirement</span>
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-text-tertiary">No household members found</p>
        </div>
      </div>
    );
  }

  const cols = GRID_COLS[Math.min(members.length, 4)] ?? GRID_COLS[4]!;

  return (
    <div className="flex flex-col gap-3">
      <span className="label-chart">Retirement</span>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", cols)}>
        {members.map((member) => (
          <RetirementMemberCard
            key={member.memberId}
            member={member}
            horizonEndYear={horizonEndYear}
          />
        ))}
      </div>
    </div>
  );
}
