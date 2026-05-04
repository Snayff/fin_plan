import { describe, it, expect, mock } from "bun:test";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import OverviewPage from "./OverviewPage";

const mockNavigate = mock(() => {});

mock.module("react-router-dom", () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), () => {}],
  useLocation: () => ({ pathname: "/overview", search: "", hash: "", state: null }),
  useParams: () => ({}),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    Object.assign(document.createElement("a"), { href: to, textContent: children }),
}));

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    isLoading: false,
    isError: false,
    data: {
      income: {
        total: 4000,
        byType: [{ type: "regular", label: "Regular income", monthlyTotal: 4000, sources: [] }],
        bySubcategory: [
          { id: "sub1", name: "Salary", monthlyTotal: 4000, oldestReviewedAt: new Date() },
        ],
        monthly: [
          {
            id: "s1",
            name: "Salary",
            amount: 4000,
            frequency: "monthly",
            incomeType: "regular",
            expectedMonth: null,
            memberId: null,
            sortOrder: 0,
            endedAt: null,
            lastReviewedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            householdId: "h1",
            subcategoryId: null,
            notes: null,
          },
        ],
        nonMonthly: [],
        oneOff: [],
      },
      committed: {
        monthlyTotal: 1500,
        monthlyAvg12: 0,
        bills: [],
        nonMonthlyBills: [],
        bySubcategory: [],
      },
      discretionary: {
        total: 800,
        categories: [],
        savings: { total: 0, allocations: [] },
        bySubcategory: [],
      },
      surplus: { amount: 1700, percentOfIncome: 42.5 },
    },
  }),
  useItemHistory: () => ({ data: undefined, isLoading: false }),
  useConfirmItem: () => ({ mutate: () => {}, isPending: false }),
  useUpdateItem: () => ({ mutate: () => {}, isPending: false }),
  useEndIncome: () => ({ mutate: () => {}, isPending: false }),
  useFinancialSummary: () => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: () => {},
  }),
}));
mock.module("@/hooks/useSettings", () => ({
  useSnapshot: () => ({ data: undefined, isLoading: false, isError: false }),
  useSnapshots: () => ({ data: [], isLoading: false, isError: false, refetch: () => {} }),
  useSettings: () => ({ data: undefined }),
  useCreateSnapshot: () => ({ mutate: () => {}, isPending: false }),
}));

describe("OverviewPage — tier navigation", () => {
  it("clicking Income tier heading calls navigate('/income')", () => {
    mockNavigate.mockClear();
    renderWithProviders(<OverviewPage />, { initialEntries: ["/overview"] });
    const heading = screen.getByTestId("tier-heading-income");
    fireEvent.click(heading);
    expect(mockNavigate).toHaveBeenCalledWith("/income");
  });
});

describe("OverviewPage — financial summary panel", () => {
  it("shows financial summary panel in right panel by default", () => {
    renderWithProviders(<OverviewPage />, { initialEntries: ["/overview"] });
    expect(screen.getByTestId("financial-summary-panel")).toBeTruthy();
  });
});
