import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { RetirementSummary } from "./RetirementSummary";
import type { RetirementMemberProjection } from "@finplan/shared";

const members: RetirementMemberProjection[] = [
  {
    memberId: "m-1",
    memberName: "Alice",
    retirementYear: 2055,
    series: [{ year: 2026, pension: 20000, savings: 5000, stocksAndShares: 2000 }],
  },
  {
    memberId: "m-2",
    memberName: "Bob",
    retirementYear: null,
    series: [{ year: 2026, pension: 0, savings: 5000, stocksAndShares: 2000 }],
  },
];

describe("RetirementSummary", () => {
  it("renders a card for each household member", () => {
    renderWithProviders(<RetirementSummary members={members} horizonEndYear={2036} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("shows empty state when no members", () => {
    renderWithProviders(<RetirementSummary members={[]} horizonEndYear={2036} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/no household members found/i)).toBeTruthy();
  });
});
