import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import GiftsPage from "./GiftsPage";

describe("GiftsPage", () => {
  it("renders placeholder content", () => {
    renderWithProviders(<GiftsPage />, { initialEntries: ["/gifts"] });
    expect(screen.getByTestId("gifts-page")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /gifts/i })).toBeTruthy();
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
  });
});
