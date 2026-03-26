import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import OverviewEmptyState from "./OverviewEmptyState";

const mockNavigate = mock(() => {});

mock.module("react-router-dom", () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), () => {}],
  useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
  useParams: () => ({}),
}));

function renderEmpty() {
  return render(<OverviewEmptyState />);
}

describe("OverviewEmptyState", () => {
  it("renders the ghosted cascade with £— placeholders", () => {
    renderEmpty();
    expect(screen.getByTestId("empty-cascade")).toBeTruthy();
    const placeholders = screen.getAllByText("£—");
    expect(placeholders.length).toBeGreaterThanOrEqual(4);
  });

  it("renders the Build your waterfall callout card", () => {
    renderEmpty();
    expect(screen.getByText("Build your waterfall")).toBeTruthy();
    expect(screen.getByRole("button", { name: /get started/i })).toBeTruthy();
  });
});
