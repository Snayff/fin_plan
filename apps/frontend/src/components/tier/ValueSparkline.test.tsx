import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import ValueSparkline from "./ValueSparkline";

describe("ValueSparkline", () => {
  it("renders the Value History label with multiple periods", () => {
    const periods = [
      { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2023-01-01"), amount: 7 },
      { id: "p2", startDate: new Date("2023-01-01"), endDate: null, amount: 9 },
    ];

    const { getByText } = render(
      <ValueSparkline periods={periods} color="text-tier-committed" now={new Date("2026-04-04")} />
    );

    expect(getByText("Value History")).toBeTruthy();
  });

  it("renders with a single period", () => {
    const periods = [{ id: "p1", startDate: new Date("2020-01-01"), endDate: null, amount: 7 }];

    const { getByText } = render(
      <ValueSparkline periods={periods} color="text-tier-committed" now={new Date("2026-04-04")} />
    );

    expect(getByText("Value History")).toBeTruthy();
  });
});
