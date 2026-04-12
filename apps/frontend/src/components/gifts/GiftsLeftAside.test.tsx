// apps/frontend/src/components/gifts/GiftsLeftAside.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { GiftsLeftAside } from "./GiftsLeftAside";

const sampleBudget = {
  annualBudget: 1000,
  planned: 500,
  spent: 100,
  plannedOverBudgetBy: 0,
  spentOverBudgetBy: 0,
};

describe("GiftsLeftAside", () => {
  it("renders title, year selector, and three mode tabs", () => {
    render(
      <GiftsLeftAside
        year={2026}
        years={[2024, 2025, 2026]}
        onYearChange={() => {}}
        mode="gifts"
        onModeChange={() => {}}
        budget={sampleBudget}
        readOnly={false}
      />
    );
    expect(screen.getByRole("heading", { name: /gifts/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /year/i })).toHaveValue("2026");
    expect(screen.getByRole("button", { name: /^gifts$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /config/i })).toBeInTheDocument();
  });

  it("invokes onModeChange when a tab is clicked", () => {
    const onModeChange = mock(() => {});
    render(
      <GiftsLeftAside
        year={2026}
        years={[2026]}
        onYearChange={() => {}}
        mode="gifts"
        onModeChange={onModeChange}
        budget={sampleBudget}
        readOnly={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /upcoming/i }));
    expect(onModeChange).toHaveBeenCalledWith("upcoming");
  });

  it("invokes onYearChange when year selector changes", () => {
    const onYearChange = mock(() => {});
    render(
      <GiftsLeftAside
        year={2026}
        years={[2024, 2025, 2026]}
        onYearChange={onYearChange}
        mode="gifts"
        onModeChange={() => {}}
        budget={sampleBudget}
        readOnly={false}
      />
    );
    fireEvent.change(screen.getByRole("combobox", { name: /year/i }), {
      target: { value: "2025" },
    });
    expect(onYearChange).toHaveBeenCalledWith(2025);
  });
});
