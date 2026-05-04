import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { NetworkStatusBanner } from "./NetworkStatusBanner";

describe("NetworkStatusBanner", () => {
  it("is hidden when no failures", () => {
    const { container } = render(<NetworkStatusBanner hasFailures={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows amber warning when hasFailures is true", () => {
    render(<NetworkStatusBanner hasFailures={true} />);
    const banner = screen.getByRole("alert");
    expect(banner.textContent).toMatch(/may not be saving/i);
    expect(banner.className).toContain("border-attention");
  });
});
