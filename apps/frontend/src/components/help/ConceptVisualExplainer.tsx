import type { ConceptVisualType } from "@/data/concepts";
import { WaterfallDiagram } from "./visuals/WaterfallDiagram";
import { AmortisationComparison } from "./visuals/AmortisationComparison";
import { NetWorthBar } from "./visuals/NetWorthBar";
import { IsaProgress } from "./visuals/IsaProgress";
import { CompoundInterestCalculator } from "./visuals/CompoundInterestCalculator";

interface Props {
  visualType: ConceptVisualType;
}

export function ConceptVisualExplainer({ visualType }: Props) {
  return (
    <div>
      {visualType === "waterfall-diagram" && <WaterfallDiagram />}
      {visualType === "amortisation-comparison" && <AmortisationComparison />}
      {visualType === "net-worth-bar" && <NetWorthBar />}
      {visualType === "isa-progress" && <IsaProgress />}
      {visualType === "compound-interest-calculator" && (
        <CompoundInterestCalculator />
      )}
    </div>
  );
}
