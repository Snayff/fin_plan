import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import HelpPage from "./HelpPage";

describe("HelpPage", () => {
  it("renders the sidebar and selects the first glossary entry by default", () => {
    renderWithProviders(<HelpPage />, { initialEntries: ["/help"] });
    expect(screen.getByText("Glossary")).toBeTruthy();
    // First glossary entry alphabetically is "Amortised (÷12)"
    expect(screen.getByRole("heading", { name: "Amortised (÷12)" })).toBeTruthy();
  });

  it("pre-selects entry from ?entry= query param", () => {
    renderWithProviders(<HelpPage />, { initialEntries: ["/help?entry=waterfall"] });
    expect(screen.getByRole("heading", { name: "Waterfall" })).toBeTruthy();
  });

  it("pre-selects concept entry from ?entry= query param", () => {
    renderWithProviders(<HelpPage />, { initialEntries: ["/help?entry=amortisation"] });
    expect(screen.getByRole("heading", { name: "Amortisation (÷12)" })).toBeTruthy();
  });

  it("falls back to default entry for unknown ?entry= value", () => {
    renderWithProviders(<HelpPage />, { initialEntries: ["/help?entry=unknown-id"] });
    // Should fall back to first glossary entry
    expect(screen.getByRole("heading", { name: "Amortised (÷12)" })).toBeTruthy();
  });
});
