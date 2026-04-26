import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ShortfallBadge } from "./ShortfallBadge";

const items = [
  {
    itemType: "committed_item" as const,
    itemId: "c1",
    itemName: "Council Tax",
    tierKey: "committed" as const,
    dueDate: "2026-05-08",
    amount: 420,
  },
];

describe("ShortfallBadge", () => {
  it("renders countdown badge with aria-label and amber dot", () => {
    render(
      <MemoryRouter>
        <ShortfallBadge
          daysToFirst={12}
          count={1}
          items={items}
          balanceToday={540}
          lowest={{ value: -123, date: "2026-05-08" }}
        />
      </MemoryRouter>
    );
    const badge = screen.getByLabelText("Cashflow shortfall: 1 item in the next 30 days");
    expect(badge).toHaveTextContent("shortfall in 12d");
  });

  it("uses plural 'items' in aria-label when count > 1", () => {
    render(
      <MemoryRouter>
        <ShortfallBadge
          daysToFirst={3}
          count={2}
          items={items}
          balanceToday={540}
          lowest={{ value: -123, date: "2026-05-08" }}
        />
      </MemoryRouter>
    );
    expect(
      screen.getByLabelText("Cashflow shortfall: 2 items in the next 30 days")
    ).toBeInTheDocument();
  });
});
