import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { RetirementMemberCard } from "./RetirementMemberCard";
import type { RetirementMemberProjection } from "@finplan/shared";

const aliceWithRetirement: RetirementMemberProjection = {
  memberId: "user-1",
  memberName: "Alice",
  retirementYear: 2027,
  series: [
    { year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 },
    { year: 2027, pension: 32000, savings: 10800, stocksAndShares: 5400 },
    { year: 2028, pension: 34000, savings: 11600, stocksAndShares: 5800 },
  ],
};

const bobNoRetirement: RetirementMemberProjection = {
  memberId: "user-2",
  memberName: "Bob",
  retirementYear: null,
  series: [{ year: 2026, pension: 0, savings: 10000, stocksAndShares: 5000 }],
};

describe("RetirementMemberCard", () => {
  it("renders member name", () => {
    renderWithProviders(
      <RetirementMemberCard member={aliceWithRetirement} horizonEndYear={2028} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("shows 'At retirement (YYYY)' label when retirement falls within horizon", () => {
    renderWithProviders(
      <RetirementMemberCard member={aliceWithRetirement} horizonEndYear={2028} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/at retirement \(2027\)/i)).toBeTruthy();
  });

  it("uses horizon end year when retirement is beyond horizon", () => {
    const farMember: RetirementMemberProjection = {
      ...aliceWithRetirement,
      retirementYear: 2060,
    };
    renderWithProviders(<RetirementMemberCard member={farMember} horizonEndYear={2028} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/at 2028/i)).toBeTruthy();
  });

  it("shows Settings link when retirementYear is null", () => {
    renderWithProviders(<RetirementMemberCard member={bobNoRetirement} horizonEndYear={2028} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/set bob's retirement year/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /settings/i })).toBeTruthy();
  });

  it("renders the three breakdown labels (Pension, Savings, S&S)", () => {
    renderWithProviders(
      <RetirementMemberCard member={aliceWithRetirement} horizonEndYear={2028} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/pension/i)).toBeTruthy();
    expect(screen.getByText(/savings/i)).toBeTruthy();
    expect(screen.getByText(/s&s/i)).toBeTruthy();
  });
});
