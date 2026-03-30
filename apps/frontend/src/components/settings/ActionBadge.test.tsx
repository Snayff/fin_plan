import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { ActionBadge } from "./ActionBadge";

describe("ActionBadge", () => {
  it("renders create badge with correct label", () => {
    renderWithProviders(<ActionBadge action="CREATE_INCOME_SOURCE" />);
    expect(screen.getByText(/created/i)).toBeTruthy();
  });

  it("renders update badge with correct label", () => {
    renderWithProviders(<ActionBadge action="UPDATE_INCOME_SOURCE" />);
    expect(screen.getByText(/updated/i)).toBeTruthy();
  });

  it("renders delete badge with correct label", () => {
    renderWithProviders(<ActionBadge action="DELETE_INCOME_SOURCE" />);
    expect(screen.getByText(/deleted/i)).toBeTruthy();
  });

  it("renders invite badge with correct label", () => {
    renderWithProviders(<ActionBadge action="INVITE_MEMBER" />);
    expect(screen.getByText(/invited/i)).toBeTruthy();
  });
});
