import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import ValueSparkline from "./ValueSparkline";

describe("ValueSparkline", () => {
  it("renders SVG with correct number of line segments", () => {
    const periods = [
      { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2023-01-01"), amount: 7 },
      { id: "p2", startDate: new Date("2023-01-01"), endDate: null, amount: 9 },
    ];

    const { container } = render(
      <ValueSparkline
        periods={periods}
        tierColorClass="text-tier-committed"
        now={new Date("2026-04-04")}
      />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("does not render when only one period", () => {
    const periods = [{ id: "p1", startDate: new Date("2020-01-01"), endDate: null, amount: 7 }];

    const { container } = render(
      <ValueSparkline
        periods={periods}
        tierColorClass="text-tier-committed"
        now={new Date("2026-04-04")}
      />
    );

    expect(container.querySelector("svg")).toBeFalsy();
  });
});
