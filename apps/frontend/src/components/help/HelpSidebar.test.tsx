import { describe, it, expect } from "bun:test";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { HelpSidebar } from "./HelpSidebar";

function renderSidebar(selectedId = "waterfall", onSelect = () => {}) {
  return renderWithProviders(
    <HelpSidebar selectedId={selectedId} onSelect={onSelect} />,
    { initialEntries: ["/help"] }
  );
}

describe("HelpSidebar", () => {
  it("renders Glossary and Concepts section headings", () => {
    renderSidebar();
    expect(screen.getByText("Glossary")).toBeTruthy();
    expect(screen.getByText("Concepts")).toBeTruthy();
  });

  it("renders all 17 glossary entries", () => {
    renderSidebar();
    expect(screen.getByText("Waterfall")).toBeTruthy();
    expect(screen.getByText("Surplus")).toBeTruthy();
    expect(screen.getByText("ISA Allowance")).toBeTruthy();
  });

  it("renders all 5 concept entries", () => {
    renderSidebar();
    expect(screen.getByText("The Waterfall")).toBeTruthy();
    expect(screen.getByText("Amortisation (÷12)")).toBeTruthy();
  });

  it("renders User Manual as coming soon (not clickable)", () => {
    renderSidebar();
    expect(screen.getByText("User Manual")).toBeTruthy();
    expect(screen.getByText("Coming soon")).toBeTruthy();
  });

  it("marks the selected entry", () => {
    renderSidebar("waterfall");
    const selected = screen.getAllByRole("button").find(
      (btn) => btn.getAttribute("aria-current") === "true"
    );
    expect(selected).toBeTruthy();
  });

  it("filters entries by search query", async () => {
    renderSidebar();
    const input = screen.getByPlaceholderText("Search…");
    await act(async () => {
      fireEvent.change(input, { target: { value: "ISA" } });
      await new Promise((r) => setTimeout(r, 200)); // debounce
    });
    expect(screen.queryByText("Surplus")).toBeNull();
    expect(screen.getByText("ISA")).toBeTruthy();
  });

  it("shows no results state when search has no matches", async () => {
    renderSidebar();
    const input = screen.getByPlaceholderText("Search…");
    await act(async () => {
      fireEvent.change(input, { target: { value: "xyznotfound" } });
      await new Promise((r) => setTimeout(r, 200));
    });
    expect(screen.getByText(/no results/i)).toBeTruthy();
  });
});
