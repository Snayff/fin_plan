import { describe, it, expect, mock } from "bun:test";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { QuickAddPanel } from "./QuickAddPanel";

const bulkMock = mock(() => Promise.resolve({ count: 0 }));

mock.module("@/hooks/useGifts", () => ({
  useQuickAddMatrix: () => ({
    isLoading: false,
    data: {
      people: [
        { id: "p1", name: "Mum", memberId: "m1" },
        { id: "p2", name: "Dad", memberId: null },
      ],
      events: [{ id: "e1", name: "Christmas" }],
      allocations: [{ personId: "p1", eventId: "e1", planned: 100 }],
      budget: { annual: 2400, currentPlanned: 100 },
    },
  }),
  useBulkUpsertAllocations: () => ({ mutate: bulkMock, isPending: false }),
}));

describe("QuickAddPanel", () => {
  it("renders a matrix with one row per person and one column per event", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByText("Christmas")).toBeInTheDocument();
  });

  it("shows people and events count in header", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    expect(screen.getByText("2 people · 1 events")).toBeInTheDocument();
  });

  it("pre-populates existing allocations", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    const cell = screen.getByTestId("cell-p1-e1") as HTMLInputElement;
    expect(cell.value).toBe("100");
  });

  it("shows household badge for members", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    expect(screen.getByText("Household")).toBeInTheDocument();
  });

  it("shows row and column totals", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    // £100 appears in Mum's row total, column total, and grand total
    const allTotals = screen.getAllByText("£100");
    expect(allTotals.length).toBeGreaterThanOrEqual(2);
  });

  it("shows summary strip with budget info", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    expect(screen.getByText(/budget/i)).toBeInTheDocument();
  });

  it("save submits cells with non-zero planned values", () => {
    renderWithProviders(<QuickAddPanel year={2026} readOnly={false} />);
    const cell = screen.getByTestId("cell-p2-e1") as HTMLInputElement;
    fireEvent.change(cell, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(bulkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cells: expect.arrayContaining([
          expect.objectContaining({ personId: "p1", eventId: "e1", year: 2026, planned: 100 }),
          expect.objectContaining({ personId: "p2", eventId: "e1", year: 2026, planned: 50 }),
        ]),
      })
    );
  });
});
