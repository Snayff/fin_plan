import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { SettingsSection } from "./SettingsSection";

describe("SettingsSection", () => {
  it("renders title with correct treatment", () => {
    renderWithProviders(
      <SettingsSection id="surplus" title="Surplus benchmark">
        <p>body</p>
      </SettingsSection>
    );
    const h = screen.getByRole("heading", { level: 3 });
    expect(h.textContent).toBe("Surplus benchmark");
    expect(h.className).toContain("uppercase");
    expect(h.className).toContain("font-heading");
    expect(h.className).toContain("text-page-accent");
  });

  it("sets data-section-id for scroll-spy", () => {
    const { container } = renderWithProviders(
      <SettingsSection id="display" title="Display">
        <p>x</p>
      </SettingsSection>
    );
    const sec = container.querySelector('[data-section-id="display"]');
    expect(sec).toBeTruthy();
  });

  it("renders optional description", () => {
    renderWithProviders(
      <SettingsSection id="profile" title="Profile" description="Your account details.">
        <p>x</p>
      </SettingsSection>
    );
    expect(screen.getByText("Your account details.")).toBeTruthy();
  });
});
