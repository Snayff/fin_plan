import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { SnapshotDot } from "./SnapshotDot";

const base = {
  id: "s1",
  name: "March 2025",
  isAuto: false,
  createdAt: "2025-03-01T10:00:00Z",
};

describe("SnapshotDot", () => {
  it("renders manual dot with solid ring class", () => {
    renderWithProviders(
      <SnapshotDot snapshot={base} isSelected={false} isLoading={false} onClick={() => {}} />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByRole("button")).toBeTruthy();
    const dot = document.querySelector("[data-testid='dot-ring']");
    expect(dot?.className).not.toContain("border-dashed");
  });

  it("renders auto dot with dashed ring class", () => {
    renderWithProviders(
      <SnapshotDot
        snapshot={{ ...base, isAuto: true }}
        isSelected={false}
        isLoading={false}
        onClick={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    const dot = document.querySelector("[data-testid='dot-ring']");
    expect(dot?.className).toContain("border-dashed");
  });

  it("renders loading pulse when isLoading", () => {
    renderWithProviders(
      <SnapshotDot snapshot={base} isSelected={false} isLoading={true} onClick={() => {}} />,
      { initialEntries: ["/overview"] }
    );
    const dot = document.querySelector("[data-testid='dot-ring']");
    expect(dot?.className).toContain("animate-pulse");
  });
});
