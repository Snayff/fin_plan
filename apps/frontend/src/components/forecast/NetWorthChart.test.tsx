import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { NetWorthChart } from "./NetWorthChart";
import type { NetWorthPoint } from "@finplan/shared";

const mockData: NetWorthPoint[] = [
  { year: 2026, nominal: 50000, real: 50000 },
  { year: 2027, nominal: 55000, real: 53658 },
  { year: 2028, nominal: 60000, real: 57100 },
];

const mockRetirementMarkers = [{ year: 2027, name: "Alice" }];

describe("NetWorthChart", () => {
  it("renders the stat row with today and horizon-end values", () => {
    renderWithProviders(
      <NetWorthChart data={mockData} retirementMarkers={mockRetirementMarkers} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/today/i)).toBeTruthy();
  });

  it("shows the empty-assets note when data is empty", () => {
    renderWithProviders(<NetWorthChart data={[]} retirementMarkers={[]} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/add assets/i)).toBeTruthy();
  });

  it("shows the empty-assets note when all nominal values are zero", () => {
    const zeroData: NetWorthPoint[] = [
      { year: 2026, nominal: 0, real: 0 },
      { year: 2027, nominal: 0, real: 0 },
    ];
    renderWithProviders(<NetWorthChart data={zeroData} retirementMarkers={[]} />, {
      initialEntries: ["/forecast"],
    });
    expect(screen.getByText(/add assets/i)).toBeTruthy();
  });
});
