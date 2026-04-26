import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ShortfallTooltip } from "./ShortfallTooltip";

const items = [
  {
    itemType: "committed_item" as const,
    itemId: "c1",
    itemName: "Council Tax",
    tierKey: "committed" as const,
    dueDate: "2026-05-08",
    amount: 420,
  },
  {
    itemType: "committed_item" as const,
    itemId: "c2",
    itemName: "Car Insurance",
    tierKey: "committed" as const,
    dueDate: "2026-05-14",
    amount: 540,
  },
];

describe("ShortfallTooltip", () => {
  it("renders lede, items, and grounding figures", () => {
    render(
      <MemoryRouter>
        <ShortfallTooltip
          items={items}
          balanceToday={540}
          lowest={{ value: -123, date: "2026-05-08" }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/Some items won't be covered/)).toBeInTheDocument();
    expect(screen.getByText("Council Tax")).toBeInTheDocument();
    expect(screen.getByText("Car Insurance")).toBeInTheDocument();
    expect(screen.getByText(/Balance today/)).toBeInTheDocument();
    expect(screen.getByText(/Lowest in 30 days/)).toBeInTheDocument();
  });

  it("caps visible items at 3 and shows a Forecast → Cashflow link for overflow", () => {
    const many = Array.from({ length: 6 }).map((_, i) => ({
      itemType: "committed_item" as const,
      itemId: `c${i}`,
      itemName: `Bill ${i}`,
      tierKey: "committed" as const,
      dueDate: `2026-05-0${i + 1}`,
      amount: 100,
    }));
    render(
      <MemoryRouter>
        <ShortfallTooltip
          items={many}
          balanceToday={0}
          lowest={{ value: -300, date: "2026-05-06" }}
        />
      </MemoryRouter>
    );
    expect(screen.getAllByTestId("shortfall-item")).toHaveLength(3);
    const link = screen.getByRole("link", { name: /open Forecast → Cashflow/ });
    expect(link).toHaveAttribute("href", "/forecast");
    expect(screen.getByText(/\+ 3 more/)).toBeInTheDocument();
  });
});
