import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddSubcategoryButton } from "./AddSubcategoryButton";

describe("AddSubcategoryButton", () => {
  it("shows a ghost button by default", () => {
    render(<AddSubcategoryButton onCreate={mock(() => Promise.resolve())} />);
    expect(screen.getByRole("button", { name: /add subcategory/i })).toBeInTheDocument();
  });

  it("toggles to inline input on click, submits name, and resets on success", async () => {
    const onCreate = mock((_name: string) => Promise.resolve());
    render(<AddSubcategoryButton onCreate={onCreate} />);
    fireEvent.click(screen.getByRole("button", { name: /add subcategory/i }));
    const input = screen.getByPlaceholderText(/new subcategory/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Subscriptions" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreate).toHaveBeenCalledWith("Subscriptions");
  });

  it("shows inline error on failure and keeps input open", async () => {
    const onCreate = mock(() =>
      Promise.reject(new Error("A subcategory with that name already exists"))
    );
    render(<AddSubcategoryButton onCreate={onCreate} />);
    fireEvent.click(screen.getByRole("button", { name: /add subcategory/i }));
    const input = screen.getByPlaceholderText(/new subcategory/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Housing" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
  });
});
