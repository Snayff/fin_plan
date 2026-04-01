import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import GoalsPage from "./GoalsPage";

describe("GoalsPage", () => {
  it("renders placeholder content", () => {
    renderWithProviders(<GoalsPage />, { initialEntries: ["/goals"] });
    expect(screen.getByTestId("goals-page")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /goals/i })).toBeTruthy();
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
  });
});
