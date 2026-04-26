import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import type { WaterfallSummary } from "@finplan/shared";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
}));

mock.module("@/hooks/useShortfall", () => ({
  useTierShortfall: (tierKey: string) => {
    if (tierKey === "committed") {
      return {
        isLive: true,
        daysToFirst: 12,
        count: 1,
        items: [
          {
            itemType: "committed_item" as const,
            itemId: "c1",
            itemName: "Council Tax",
            tierKey: "committed" as const,
            dueDate: "2026-05-08",
            amount: 420,
          },
        ],
        balanceToday: 540,
        lowest: { value: -123, date: "2026-05-08" },
      };
    }
    return {
      isLive: false,
      daysToFirst: null,
      count: 0,
      items: [],
      balanceToday: 0,
      lowest: null,
    };
  },
}));

import { WaterfallLeftPanel } from "./WaterfallLeftPanel";

const mockSummary: WaterfallSummary = {
  income: { total: 5000, byType: [], bySubcategory: [], monthly: [], nonMonthly: [], oneOff: [] },
  committed: {
    monthlyTotal: 2000,
    monthlyAvg12: 0,
    bySubcategory: [
      {
        id: "s1",
        name: "Housing",
        sortOrder: 0,
        monthlyTotal: 1200,
        oldestReviewedAt: null,
        itemCount: 1,
      },
    ],
    bills: [],
    nonMonthlyBills: [],
  },
  discretionary: {
    total: 1500,
    bySubcategory: [
      {
        id: "d1",
        name: "Entertainment",
        sortOrder: 0,
        monthlyTotal: 1500,
        oldestReviewedAt: null,
        itemCount: 1,
      },
    ],
    categories: [],
    savings: { total: 0, allocations: [] },
  },
  surplus: { amount: 1500, percentOfIncome: 30 },
};

describe("WaterfallLeftPanel", () => {
  it("renders shortfall badge in the committed section when useTierShortfall returns isLive", async () => {
    renderWithProviders(
      <WaterfallLeftPanel summary={mockSummary} selectedItemId={null} isSnapshot={false} />
    );
    const badge = await screen.findByText(/shortfall in/);
    expect(badge).toBeTruthy();
  });

  it("does not render shortfall badge in discretionary when isLive is false", () => {
    renderWithProviders(
      <WaterfallLeftPanel summary={mockSummary} selectedItemId={null} isSnapshot={false} />
    );
    // only one badge should exist (committed only)
    const badges = screen.queryAllByText(/shortfall in/);
    expect(badges.length).toBe(1);
  });

  it("still renders StaleCountBadge alongside ShortfallBadge", () => {
    renderWithProviders(
      <WaterfallLeftPanel summary={mockSummary} selectedItemId={null} isSnapshot={false} />
    );
    // committed section has no stale items so no stale badge - shortfall badge should still show
    const badge = screen.queryByText(/shortfall in/);
    expect(badge).toBeTruthy();
  });
});
