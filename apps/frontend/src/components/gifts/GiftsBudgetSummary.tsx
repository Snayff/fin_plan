import { OverBudgetSignal } from "./OverBudgetSignal";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";
import type { GiftBudgetSummary } from "@finplan/shared";

type Props = { budget: GiftBudgetSummary; readOnly: boolean };

export function GiftsBudgetSummary({ budget }: Props) {
  return (
    <div className="space-y-3 px-4 py-4">
      <div>
        <div className="label-section">
          <GlossaryTermMarker entryId="gifts-annual-budget">Annual budget</GlossaryTermMarker>
        </div>
        <div
          data-testid="gifts-budget-annual"
          className="font-mono text-2xl tabular-nums text-foreground"
        >
          £{budget.annualBudget.toLocaleString()}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label-section">
            <GlossaryTermMarker entryId="gifts-planned">Planned</GlossaryTermMarker>
          </div>
          <div
            data-testid="gifts-budget-planned"
            className="font-mono text-base tabular-nums text-foreground/65"
          >
            £{budget.planned.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="label-section">
            <GlossaryTermMarker entryId="gifts-spent">Spent</GlossaryTermMarker>
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
