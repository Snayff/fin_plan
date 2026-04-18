import * as Tabs from "@radix-ui/react-tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { NavLink } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";
import { usePrefersReducedMotion } from "@/utils/motion";
import { cn } from "@/lib/utils";
import type { RetirementMemberProjection } from "@finplan/shared";

interface RetirementChartProps {
  members: RetirementMemberProjection[];
  horizonEndYear: number;
}

export function RetirementChart({ members, horizonEndYear }: RetirementChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  if (members.length === 0) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-xl p-5">
        <span className="label-chart">Retirement</span>
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-text-tertiary">No household members found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl overflow-hidden">
      <Tabs.Root defaultValue={members[0]!.memberId}>
        <div className="px-5 pt-4 pb-0 flex items-center justify-between">
          <span className="label-chart">Retirement</span>
          <Tabs.List className="flex gap-0.5" aria-label="Household members">
            {members.map((m) => (
              <Tabs.Trigger
                key={m.memberId}
                value={m.memberId}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-body transition-colors duration-150",
                  "text-text-tertiary hover:text-text-secondary",
                  "data-[state=active]:bg-surface-elevated data-[state=active]:text-text-primary"
                )}
              >
                {m.memberName}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        {members.map((member) => {
          const last = member.series[member.series.length - 1];
          const retirementLabel =
            member.retirementYear != null && member.retirementYear <= horizonEndYear
              ? `At retirement (${member.retirementYear})`
              : `At ${horizonEndYear}`;

          const statPoint =
            member.retirementYear != null
              ? (member.series.find((s) => s.year === member.retirementYear) ?? last)
              : last;

          const total = statPoint
            ? statPoint.pension + statPoint.savings + statPoint.stocksAndShares
            : 0;

          return (
            <Tabs.Content key={member.memberId} value={member.memberId} forceMount>
              {member.retirementYear == null ? (
                <div className="h-40 flex items-center justify-center px-6">
                  <p className="text-sm text-text-tertiary text-center">
                    Set {member.memberName}&apos;s retirement year in{" "}
                    <NavLink to="/settings" className="underline text-page-accent">
                      Settings
                    </NavLink>{" "}
                    to see their projection
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-40 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={member.series}
                        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`pensionGrad-${member.memberId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient
                            id={`savingsGrad-${member.memberId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient
                            id={`ssGrad-${member.memberId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
                          tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                          tickLine={false}
                          axisLine={false}
                          width={48}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatCurrency(value, showPence),
                            name === "pension"
                              ? "Pension"
                              : name === "savings"
                                ? "Savings"
                                : "Stocks & Shares",
                          ]}
                          contentStyle={{
                            background: "#141b2e",
                            border: "1px solid #222c45",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="pension"
                          stackId="1"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill={`url(#pensionGrad-${member.memberId})`}
                          dot={false}
                          isAnimationActive={!prefersReducedMotion}
                        />
                        <Area
                          type="monotone"
                          dataKey="savings"
                          stackId="1"
                          stroke="#6366f1"
                          strokeWidth={1.5}
                          fill={`url(#savingsGrad-${member.memberId})`}
                          dot={false}
                          isAnimationActive={!prefersReducedMotion}
                        />
                        <Area
                          type="monotone"
                          dataKey="stocksAndShares"
                          stackId="1"
                          stroke="#0ea5e9"
                          strokeWidth={1.5}
                          fill={`url(#ssGrad-${member.memberId})`}
                          dot={false}
                          isAnimationActive={!prefersReducedMotion}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend + stat row */}
                  <div className="px-5 py-3 border-t border-surface-elevated">
                    <div className="flex items-center gap-4 mb-2">
                      {[
                        { key: "pension", label: "Pension", color: "#8b5cf6" },
                        { key: "savings", label: "Savings", color: "#6366f1" },
                        { key: "stocksAndShares", label: "Stocks & Shares", color: "#0ea5e9" },
                      ].map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-text-tertiary">{label}</span>
                          {statPoint && (
                            <span className="font-numeric text-xs text-text-secondary tabular-nums">
                              {formatCurrency(
                                statPoint[key as keyof typeof statPoint] as number,
                                showPence
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">{retirementLabel}:</span>
                      <span className="font-numeric text-sm font-semibold text-text-primary tabular-nums">
                        {formatCurrency(total, showPence)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </div>
  );
}
