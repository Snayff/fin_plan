import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { PanelError } from "./PanelError";

describe("PanelError", () => {
  it("renders Failed to load label", () => {
    render(<PanelError variant="right" onRetry={() => {}} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("renders optional contextual message", () => {
    render(<PanelError variant="right" onRetry={() => {}} message="Could not load accounts" />);
    expect(screen.getByText("Could not load accounts")).toBeTruthy();
  });

  it("calls onRetry when Retry is clicked", () => {
    const onRetry = mock(() => {});
    render(<PanelError variant="right" onRetry={onRetry} />);
    screen.getByText("Retry").click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders left variant", () => {
    const { container } = render(<PanelError variant="left" onRetry={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders detail variant", () => {
    const { container } = render(<PanelError variant="detail" onRetry={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });
});
