import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttentionStrip } from "./AttentionStrip";

describe("AttentionStrip", () => {
  it("renders body content with status role and amber dot", () => {
    render(
      <AttentionStrip
        body={
          <>
            Cashflow won't cover <strong>2 items</strong>
          </>
        }
        tooltip={<div>tooltip body</div>}
        ariaLabel="Cashflow shortfall: 2 items"
      />
    );
    const strip = screen.getByRole("status");
    expect(strip).toHaveAttribute("aria-live", "polite");
    expect(strip).toHaveAttribute("aria-label", "Cashflow shortfall: 2 items");
    expect(strip.textContent).toContain("Cashflow won't cover");
    expect(strip.textContent).toContain("2 items");
  });

  it("reveals tooltip on hover", async () => {
    const user = userEvent.setup();
    render(<AttentionStrip body={<>Heads up</>} tooltip={<div>Tooltip details</div>} />);
    await user.hover(screen.getByRole("status"));
    const tooltipInstances = await screen.findAllByText("Tooltip details");
    expect(tooltipInstances.length).toBeGreaterThan(0);
  });
});
