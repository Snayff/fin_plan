import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigPlannerModePanel } from "./ConfigPlannerModePanel";

const setModeMock = mock(() => Promise.resolve({}));

mock.module("@/hooks/useGifts", () => ({
  useSetGiftMode: () => ({ mutate: setModeMock, isPending: false }),
}));

describe("ConfigPlannerModePanel", () => {
  it("displays current mode (synced)", () => {
    render(<ConfigPlannerModePanel currentMode="synced" readOnly={false} />);
    expect(screen.getByLabelText(/synced/i)).toBeChecked();
  });

  it("opens confirm dialog before switching to independent", () => {
    render(<ConfigPlannerModePanel currentMode="synced" readOnly={false} />);
    fireEvent.click(screen.getByLabelText(/independent/i));
    expect(screen.getByText(/will be deleted/i)).toBeInTheDocument();
    expect(setModeMock).not.toHaveBeenCalled();
  });

  it("calls setMode after confirmation", () => {
    render(<ConfigPlannerModePanel currentMode="synced" readOnly={false} />);
    fireEvent.click(screen.getByLabelText(/independent/i));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(setModeMock).toHaveBeenCalledWith({ mode: "independent" });
  });
});
