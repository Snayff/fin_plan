import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { SurplusAccumulationChart } from "./SurplusAccumulationChart";
import type { SurplusPoint } from "@finplan/shared";

const mockData: SurplusPoint[] = [
  { year: 2026, cumulative: 0 },
  { year: 2027, cumulative: 12000 },
  { year: 2028, cumulative: 24000 },
];

describe("SurplusAccumulationChart", () => {
  it("renders the section heading", () => {
    renderWithProviders(<SurplusAccumulationChart data={mockData} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/surplus accumulation/i)).toBeTruthy();
  });

  it("shows stat row with today (£0) and horizon-end total", () => {
    renderWithProviders(<SurplusAccumulationChart data={mockData} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/today/i)).toBeTruthy();
  });

  it("shows empty-assets note when all values are zero", () => {
    const zeroData: SurplusPoint[] = [
      { year: 2026, cumulative: 0 },
      { year: 2027, cumulative: 0 },
    ];
    renderWithProviders(<SurplusAccumulationChart data={zeroData} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/add assets/i)).toBeTruthy();
  });

  it("shows empty-assets note when fewer than 2 data points", () => {
    renderWithProviders(<SurplusAccumulationChart data={[{ year: 2026, cumulative: 5000 }]} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/add assets/i)).toBeTruthy();
  });
});
