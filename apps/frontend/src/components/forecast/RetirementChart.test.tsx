import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, fireEvent } from "@testing-library/react";
import { RetirementChart } from "./RetirementChart";
import type { RetirementMemberProjection } from "@finplan/shared";

const twoMembers: RetirementMemberProjection[] = [
  {
    memberId: "user-1",
    memberName: "Alice",
    retirementYear: 2055,
    series: [
      { year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 },
      { year: 2027, pension: 32000, savings: 10800, stocksAndShares: 5400 },
    ],
  },
  {
    memberId: "user-2",
    memberName: "Bob",
    retirementYear: null,
    series: [{ year: 2026, pension: 0, savings: 10000, stocksAndShares: 5000 }],
  },
];

describe("RetirementChart", () => {
  it("renders a tab for each household member", () => {
    renderWithProviders(<RetirementChart members={twoMembers} horizonEndYear={2028} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByRole("tab", { name: /alice/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /bob/i })).toBeTruthy();
  });

  it("shows the retirement empty state when a member has no retirementYear", () => {
    renderWithProviders(<RetirementChart members={twoMembers} horizonEndYear={2028} />, {
      initialEntries: ["/forecast"],
    });
    // Click Bob's tab
    fireEvent.click(screen.getByRole("tab", { name: /bob/i }));
    expect(screen.getByText(/set bob's retirement year/i)).toBeTruthy();
  });

  it("renders without crashing when there are no members", () => {
    renderWithProviders(<RetirementChart members={[]} horizonEndYear={2028} />, {
      initialEntries: ["/forecast"],
    });
  });
});
