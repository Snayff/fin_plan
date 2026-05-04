import { describe, it, expect, mock } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { SettingsLeftPanel } from "./SettingsLeftPanel";

describe("SettingsLeftPanel", () => {
  it("renders PageHeader title and sub-label", () => {
    renderWithProviders(
      <SettingsLeftPanel
        title="Profile"
        subLabel="Your personal preferences"
        activeId="account"
        items={[
          { id: "account", label: "Account" },
          { id: "display", label: "Display" },
        ]}
        onNavClick={() => {}}
      />
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Profile");
    expect(screen.getByText("Your personal preferences")).toBeTruthy();
  });

  it("renders flat items when no group keys are present", () => {
    renderWithProviders(
      <SettingsLeftPanel
        title="Profile"
        activeId="account"
        items={[
          { id: "account", label: "Account" },
          { id: "display", label: "Display" },
        ]}
        onNavClick={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Account" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Display" })).toBeTruthy();
  });

  it("renders group headers when items carry a group key", () => {
    renderWithProviders(
      <SettingsLeftPanel
        title="Household"
        activeId="details"
        items={[
          { id: "details", label: "Details", group: "General" },
          { id: "members", label: "Members & invites", group: "General" },
          { id: "surplus", label: "Surplus benchmark", group: "Financial" },
        ]}
        onNavClick={() => {}}
      />
    );
    expect(screen.getByText("General")).toBeTruthy();
    expect(screen.getByText("Financial")).toBeTruthy();
  });

  it("applies indicator-pattern classes to the active item and aria-current", () => {
    renderWithProviders(
      <SettingsLeftPanel
        title="Profile"
        activeId="display"
        items={[
          { id: "account", label: "Account" },
          { id: "display", label: "Display" },
        ]}
        onNavClick={() => {}}
      />
    );
    const active = screen.getByRole("button", { name: "Display" });
    expect(active.getAttribute("aria-current")).toBe("true");
    expect(active.className).toContain("text-page-accent");
    expect(active.className).toContain("border-l-2");
    expect(active.className).toContain("border-page-accent");
  });

  it("calls onNavClick with the clicked id", () => {
    const onNavClick = mock(() => {});
    renderWithProviders(
      <SettingsLeftPanel
        title="Profile"
        activeId="account"
        items={[
          { id: "account", label: "Account" },
          { id: "display", label: "Display" },
        ]}
        onNavClick={onNavClick}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Display" }));
    expect(onNavClick).toHaveBeenCalledWith("display");
  });
});
