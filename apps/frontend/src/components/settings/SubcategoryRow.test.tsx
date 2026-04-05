import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";

// Mock @dnd-kit/sortable since it needs DndContext
mock.module("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

mock.module("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const { SubcategoryRow } = await import("./SubcategoryRow");

describe("SubcategoryRow", () => {
  const defaultProps = {
    id: "sub-1",
    name: "Housing",
    isLocked: false,
    isOther: false,
    onNameChange: mock(() => {}),
    onRemove: mock(() => {}),
  };

  it("renders an editable text input for non-locked, non-Other rows", () => {
    render(createElement(SubcategoryRow, defaultProps));
    const input = screen.getByDisplayValue("Housing");
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).disabled).toBe(false);
  });

  it("renders read-only for Other subcategory", () => {
    render(createElement(SubcategoryRow, { ...defaultProps, isOther: true }));
    const input = screen.getByDisplayValue("Housing");
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it("renders read-only for locked subcategory", () => {
    render(createElement(SubcategoryRow, { ...defaultProps, isLocked: true }));
    const input = screen.getByDisplayValue("Housing");
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it("hides remove button for Other and locked rows", () => {
    const { container: c1 } = render(
      createElement(SubcategoryRow, { ...defaultProps, isOther: true })
    );
    expect(c1.querySelector("[data-testid='remove-sub']")).toBeNull();

    const { container: c2 } = render(
      createElement(SubcategoryRow, { ...defaultProps, isLocked: true })
    );
    expect(c2.querySelector("[data-testid='remove-sub']")).toBeNull();
  });

  it("calls onNameChange when input changes", () => {
    const onNameChange = mock(() => {});
    render(createElement(SubcategoryRow, { ...defaultProps, onNameChange }));
    const input = screen.getByDisplayValue("Housing");
    fireEvent.change(input, { target: { value: "Accommodation" } });
    expect(onNameChange).toHaveBeenCalledWith("Accommodation");
  });

  it("calls onRemove when remove button clicked", () => {
    const onRemove = mock(() => {});
    render(createElement(SubcategoryRow, { ...defaultProps, onRemove }));
    const btn = screen.getByTestId("remove-sub");
    fireEvent.click(btn);
    expect(onRemove).toHaveBeenCalled();
  });
});
