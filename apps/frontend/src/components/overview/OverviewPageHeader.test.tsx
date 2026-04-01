import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { OverviewPageHeader } from "./OverviewPageHeader";

describe("OverviewPageHeader", () => {
  it("renders blank strip in live mode (no Overview text)", () => {
    const { container } = renderWithProviders(
      <OverviewPageHeader activeSnapshot={null} onExitSnapshot={() => {}} />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.queryByText("Overview")).toBeNull();
    expect(screen.queryByText("Read only")).toBeNull();
    // Strip still renders for layout spacing
    expect(container.querySelector(".h-8.border-b")).toBeTruthy();
  });

  it("renders snapshot context without Overview prefix", () => {
    renderWithProviders(
      <OverviewPageHeader
        activeSnapshot={{ id: "s1", name: "March 2025" }}
        onExitSnapshot={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.queryByText("Overview")).toBeNull();
    expect(screen.getByText("March 2025")).toBeTruthy();
    expect(screen.getByText("Read only")).toBeTruthy();
    expect(screen.getByText("← Live view")).toBeTruthy();
  });

  it("renders name span with title for long snapshot names", () => {
    const longName = "A".repeat(45);
    renderWithProviders(
      <OverviewPageHeader
        activeSnapshot={{ id: "s1", name: longName }}
        onExitSnapshot={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByTitle(longName)).toBeTruthy();
  });
});
