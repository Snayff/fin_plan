import { describe, it } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { Button } from "./button";
import { expectNoA11yViolations } from "@/test/helpers/axe";

describe("Button", () => {
  it("has no serious or critical a11y violations", async () => {
    const { container } = renderWithProviders(<Button>Save</Button>);
    await expectNoA11yViolations(container);
  });
});
