import { OverBudgetSignal } from "./OverBudgetSignal";
import { InfoTip } from "@/components/ui/InfoTip";
import type { GiftBudgetSummary } from "@finplan/shared";

type Props = { budget: GiftBudgetSummary; readOnly: boolean };

export function GiftsBudgetSummary({ budget }: Props) {
  return (
    <div className="space-y-3 px-4 py-4">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-foreground/55">
          <InfoTip text="The total amount set aside for gift-giving this year. In Synced mode this flows into the waterfall as a Discretionary item; in Independent mode it is tracked here only.">
            Annual budget
          </InfoTip>
        </div>
        <div
          data-testid="gifts-budget-annual"
          className="font-mono text-2xl tabular-nums text-foreground"
        >
          £{budget.annualBudget.toLocaleString()}
        </div>
        {budget.annualBudget === 0 && (
          <div className="text-[11px] text-foreground/30">
            Set via Config → Mode to link to your waterfall, or enter a standalone amount.
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-foreground/55">
            <InfoTip text="The sum of all planned gift amounts across every person and event this year. Compare against your annual budget to see whether your plan fits.">
              Planned
            </InfoTip>
          </div>
          <div
            data-testid="gifts-budget-planned"
            className="font-mono text-base tabular-nums text-foreground/65"
          >
            £{budget.planned.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-foreground/55">
            <InfoTip text="The sum of amounts actually spent on gifts so far this year.">
              Spent
            </InfoTip>
          </div>
          <div
            data-testid="gifts-budget-spent"
            className="font-mono text-base tabular-nums text-foreground/65"
          >
            £{budget.spent.toLocaleString()}
          </div>
        </div>
      </div>
      <OverBudgetSignal kind="planned" amountOver={budget.plannedOverBudgetBy} />
      <OverBudgetSignal kind="spent" amountOver={budget.spentOverBudgetBy} />
    </div>
  );
}
