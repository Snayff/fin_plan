import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigModePanel } from "./ConfigModePanel";

mock.module("./ConfigPeoplePanel", () => ({
  ConfigPeoplePanel: () => <div data-testid="people-panel" />,
}));
mock.module("./ConfigEventsPanel", () => ({
  ConfigEventsPanel: () => <div data-testid="events-panel" />,
}));
mock.module("./ConfigPlannerModePanel", () => ({
  ConfigPlannerModePanel: () => <div data-testid="mode-panel" />,
}));
mock.module("./QuickAddPanel", () => ({
  QuickAddPanel: () => <div data-testid="quickadd-panel" />,
}));

describe("ConfigModePanel", () => {
  it("renders three drill rows in state 2", () => {
    render(<ConfigModePanel currentMode="synced" readOnly={false} year={2026} />);
    expect(screen.getByText(/people/i)).toBeInTheDocument();
    expect(screen.getByText(/events/i)).toBeInTheDocument();
    expect(screen.getByText(/^mode$/i)).toBeInTheDocument();
    expect(screen.getByText(/quick add/i)).toBeInTheDocument();
  });

  it("drills into people panel", async () => {
    render(<ConfigModePanel currentMode="synced" readOnly={false} year={2026} />);
    fireEvent.click(screen.getByText(/people/i));
    expect(await screen.findByTestId("people-panel")).toBeInTheDocument();
  });

  it("drills into mode panel", async () => {
    render(<ConfigModePanel currentMode="synced" readOnly={false} year={2026} />);
    fireEvent.click(screen.getByText(/^mode$/i));
    expect(await screen.findByTestId("mode-panel")).toBeInTheDocument();
  });
});
