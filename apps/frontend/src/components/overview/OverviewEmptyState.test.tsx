import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("react-router-dom", () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mock(() => {}),
  useSearchParams: () => [new URLSearchParams(), () => {}],
  useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
  useParams: () => ({}),
}));

const { default: OverviewEmptyState } = await import("./OverviewEmptyState");

describe("OverviewEmptyState", () => {
  it("renders a ghosted cascade of four tier labels", () => {
    render(<OverviewEmptyState />);
    // Use getAllByText to handle cases where the word appears in multiple elements
    expect(screen.getAllByText(/^income$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^committed spend$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^discretionary$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^surplus$/i).length).toBeGreaterThan(0);
  });

  it("renders a 'Build your waterfall' CTA link pointing to /waterfall", () => {
    render(<OverviewEmptyState />);
    const cta = screen.getByRole("link", { name: /build your waterfall/i });
    expect(cta.getAttribute("href")).toBe("/waterfall");
  });
});
