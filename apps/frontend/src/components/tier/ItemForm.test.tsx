import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemForm from "./ItemForm";
import { TIER_CONFIGS } from "./tierConfig";

const subcategories = [
  { id: "sub-housing", name: "Housing" },
  { id: "sub-utilities", name: "Utilities" },
];

describe("ItemForm — add mode", () => {
  it("renders field labels with asterisks for required fields", () => {
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText(/name/i)).toBeTruthy();
    expect(screen.getByText(/amount/i)).toBeTruthy();
    // Asterisks on required fields
    const labels = screen.getAllByText("*");
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it("renders descriptive placeholders", () => {
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByPlaceholderText("e.g. Netflix, Council Tax")).toBeTruthy();
    expect(screen.getByPlaceholderText("0.00")).toBeTruthy();
    expect(screen.getByPlaceholderText("Any details worth remembering")).toBeTruthy();
  });

  it("renders Cancel and Save buttons only in add mode", () => {
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /still correct/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("Save is the rightmost button in add mode", () => {
    const { container } = render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    const buttons = container.querySelectorAll("[data-testid='form-actions'] button");
    const lastButton = buttons[buttons.length - 1];
    expect(lastButton?.textContent).toMatch(/save/i);
  });

  it("calls onSave with form data on submit", () => {
    let savedData: any = null;
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={(data) => {
          savedData = data;
        }}
        onCancel={() => {}}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. Netflix, Council Tax"), {
      target: { value: "Rent" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1200" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(savedData).toBeTruthy();
    expect(savedData.name).toBe("Rent");
    expect(savedData.amount).toBe(1200);
  });

  it("calls onCancel when Cancel is clicked", () => {
    let cancelled = false;
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {
          cancelled = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(cancelled).toBe(true);
  });
});

describe("ItemForm — edit mode (stale item)", () => {
  const staleItem = {
    id: "item-1",
    name: "Rent",
    amount: 1200,
    spendType: "monthly" as const,
    subcategoryId: "sub-housing",
    notes: "Fixed rate",
    lastReviewedAt: new Date("2024-01-01"),
  };

  it("renders button order: Cancel, Delete, Still correct, Save", () => {
    const { container } = render(
      <ItemForm
        mode="edit"
        item={staleItem}
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
        onConfirm={() => {}}
        onDelete={() => {}}
        isStale={true}
      />
    );
    const buttons = container.querySelectorAll("[data-testid='form-actions'] button");
    expect(buttons[0]?.textContent).toMatch(/cancel/i);
    // After spacer: Delete, Still correct, Save
    const rightButtons = Array.from(buttons).slice(1);
    expect(rightButtons.some((b) => b.textContent?.match(/delete/i))).toBe(true);
    expect(rightButtons.some((b) => b.textContent?.match(/still correct/i))).toBe(true);
    const lastButton = buttons[buttons.length - 1];
    expect(lastButton?.textContent).toMatch(/save/i);
  });
});

describe("ItemForm — edit mode (fresh item)", () => {
  const freshItem = {
    id: "item-2",
    name: "Gym",
    amount: 3999,
    spendType: "monthly" as const,
    subcategoryId: "sub-housing",
    notes: null,
    lastReviewedAt: new Date("2026-01-01"),
  };

  it("does not show Still correct for non-stale items", () => {
    render(
      <ItemForm
        mode="edit"
        item={freshItem}
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
        onConfirm={() => {}}
        onDelete={() => {}}
        isStale={false}
      />
    );
    expect(screen.queryByRole("button", { name: /still correct/i })).toBeNull();
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeTruthy();
  });
});
