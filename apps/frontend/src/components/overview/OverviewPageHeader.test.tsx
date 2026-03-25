import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { OverviewPageHeader } from "./OverviewPageHeader";

describe("OverviewPageHeader", () => {
  it("renders 'Overview' heading in live mode", () => {
    renderWithProviders(<OverviewPageHeader activeSnapshot={null} onExitSnapshot={() => {}} />, {
      initialEntries: ["/overview"],
    });
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.queryByText("Read only")).toBeNull();
  });

  it("renders breadcrumb in snapshot mode", () => {
    renderWithProviders(
      <OverviewPageHeader
        activeSnapshot={{ id: "s1", name: "March 2025" }}
        onExitSnapshot={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByText("Overview")).toBeTruthy();
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
