import { describe, it } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { TwoPanelLayout } from "./TwoPanelLayout";
import { expectNoA11yViolations } from "@/test/helpers/axe";

describe("TwoPanelLayout", () => {
  it("has no serious or critical a11y violations", async () => {
    const { container } = renderWithProviders(
      <TwoPanelLayout left={<div>Left panel</div>} right={<div>Right panel</div>} />
    );
    await expectNoA11yViolations(container);
  });

  it("has no serious or critical a11y violations when right is null", async () => {
    const { container } = renderWithProviders(
      <TwoPanelLayout left={<div>Left panel</div>} right={null} rightPlaceholder="Select an item" />
    );
    await expectNoA11yViolations(container);
  });
});
