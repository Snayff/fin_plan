import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickAddPanel } from "./QuickAddPanel";

const bulkMock = mock(() => Promise.resolve({ count: 0 }));

mock.module("@/hooks/useGifts", () => ({
  useConfigPeople: () => ({
    isLoading: false,
    data: [
      { id: "p1", name: "Mum" },
      { id: "p2", name: "Dad" },
    ],
  }),
  useConfigEvents: () => ({
    isLoading: false,
    data: [{ id: "e1", name: "Christmas", isLocked: true }],
  }),
  useBulkUpsertAllocations: () => ({ mutate: bulkMock, isPending: false }),
}));

describe("QuickAddPanel", () => {
  it("renders a matrix with one column per person and one row per event", () => {
    render(<QuickAddPanel year={2026} readOnly={false} />);
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByText("Christmas")).toBeInTheDocument();
  });

  it("save submits cells with non-zero planned values", () => {
    render(<QuickAddPanel year={2026} readOnly={false} />);
    const cell = screen.getByTestId("cell-e1-p1") as HTMLInputElement;
    fireEvent.change(cell, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(bulkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cells: expect.arrayContaining([
          expect.objectContaining({ personId: "p1", eventId: "e1", year: 2026, planned: 50 }),
        ]),
      })
    );
  });
});
