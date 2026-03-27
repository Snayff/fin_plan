import { describe, it, expect, mock } from "bun:test";
import { render } from "@testing-library/react";
import OverviewEmptyState from "./OverviewEmptyState";

mock.module("react-router-dom", () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => mock(() => {}),
  useSearchParams: () => [new URLSearchParams(), () => {}],
  useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
  useParams: () => ({}),
}));

describe("OverviewEmptyState", () => {
  it("renders without crashing", () => {
    const { container } = render(<OverviewEmptyState />);
    expect(container).toBeTruthy();
  });
});
