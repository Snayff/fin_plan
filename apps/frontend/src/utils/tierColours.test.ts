import { describe, it, expect } from "bun:test";
import { generateTierColours } from "./tierColours";

describe("generateTierColours", () => {
  it("returns colours for committed tier using indigo scale", () => {
    const colours = generateTierColours("committed", 3);
    expect(colours).toHaveLength(3);
    // Brightest first (largest value gets brightest)
    expect(colours[0]).toBe("#818cf8"); // indigo-400
  });

  it("returns colours for discretionary tier using purple scale", () => {
    const colours = generateTierColours("discretionary", 3);
    expect(colours).toHaveLength(3);
    expect(colours[0]).toBe("#c084fc"); // purple-400
  });

  it("caps at 7 colours", () => {
    const colours = generateTierColours("committed", 10);
    expect(colours).toHaveLength(7);
  });

  it("returns 1 colour for a single segment", () => {
    const colours = generateTierColours("committed", 1);
    expect(colours).toHaveLength(1);
    expect(colours[0]).toBe("#818cf8");
  });

  it("returns empty array for 0 segments", () => {
    const colours = generateTierColours("committed", 0);
    expect(colours).toHaveLength(0);
  });
});
