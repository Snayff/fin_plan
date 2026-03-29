import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { WealthLeftPanel } from "./WealthLeftPanel";
import type { WealthSummary } from "@finplan/shared";

const mockSummary: WealthSummary = {
  netWorth: 50000,
  ytdChange: 1200,
  byLiquidity: { cashAndSavings: 20000, investmentsAndPensions: 25000, propertyAndVehicles: 5000 },
  byClass: { savings: 20000, pensions: 15000, investments: 10000, property: 5000, vehicles: 0, other: 0 },
};

describe("WealthLeftPanel typography", () => {
  it("renders hero amount with font-numeric class (not font-mono)", () => {
    render(
      <WealthLeftPanel
        summary={mockSummary}
        accounts={[]}
        onSelectClass={() => {}}
        onSelectTrust={() => {}}
        selectedClass={null}
        selectedTrustName={null}
      />
    );
    const heroEl = screen.getByText("£50,000.00");
    expect(heroEl.className).toContain("font-numeric");
    expect(heroEl.className).not.toContain("font-mono");
  });

  it("renders Net Worth section label with canonical treatment", () => {
    render(
      <WealthLeftPanel
        summary={mockSummary}
        accounts={[]}
        onSelectClass={() => {}}
        onSelectTrust={() => {}}
        selectedClass={null}
        selectedTrustName={null}
      />
    );
    const label = screen.getByText(/net worth/i).closest("p")!;
    expect(label.className).toContain("tracking-wider");
    expect(label.className).not.toContain("tracking-wide");
    expect(label.className).not.toContain("tracking-widest");
  });
});
