import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";

const { ReassignmentPrompt } = await import("./ReassignmentPrompt");

describe("ReassignmentPrompt", () => {
  const defaultProps = {
    isOpen: true,
    subcategoryName: "Utilities",
    itemCount: 3,
    destinations: [
      { id: "sub-1", name: "Housing" },
      { id: "sub-other", name: "Other" },
    ],
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
  };

  it("shows the item count and subcategory name", () => {
    render(createElement(ReassignmentPrompt, defaultProps));
    expect(screen.getByText(/3 items/i)).toBeDefined();
    expect(screen.getByText(/Utilities/)).toBeDefined();
  });

  it("disables confirm button until a destination is selected", () => {
    render(createElement(ReassignmentPrompt, defaultProps));
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls onCancel when cancel is clicked", () => {
    const onCancel = mock(() => {});
    render(createElement(ReassignmentPrompt, { ...defaultProps, onCancel }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
