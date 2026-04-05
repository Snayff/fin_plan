import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";

const { ResetConfirmationModal } = await import("./ResetConfirmationModal");

describe("ResetConfirmationModal", () => {
  const defaultProps = {
    isOpen: true,
    nonDefaultSubs: [
      { id: "sub-custom", tier: "income" as const, name: "Custom Income", itemCount: 2 },
      { id: "sub-empty", tier: "committed" as const, name: "Empty Custom", itemCount: 0 },
    ],
    defaultDestinations: {
      income: [{ id: "sub-other-i", name: "Other" }],
      committed: [{ id: "sub-other-c", name: "Other" }],
      discretionary: [{ id: "sub-other-d", name: "Other" }],
    },
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
    isLoading: false,
  };

  it("shows subcategories with items requiring reassignment", () => {
    render(createElement(ResetConfirmationModal, defaultProps));
    expect(screen.getByText(/Custom Income/)).toBeDefined();
    expect(screen.getByText(/2 items/i)).toBeDefined();
  });

  it("shows subcategories with zero items as 'will be removed'", () => {
    render(createElement(ResetConfirmationModal, defaultProps));
    expect(screen.getByText(/will be removed/i)).toBeDefined();
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = mock(() => {});
    render(createElement(ResetConfirmationModal, { ...defaultProps, onCancel }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
