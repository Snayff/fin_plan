import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, fireEvent } from "@testing-library/react";
import { TimeHorizonSelector } from "./TimeHorizonSelector";
import type { ForecastHorizon } from "@finplan/shared";

describe("TimeHorizonSelector", () => {
  it("renders all five horizon buttons", () => {
    renderWithProviders(<TimeHorizonSelector value={10} onChange={() => {}} />, {
      initialEntries: ["/forecast"],
    });
    for (const label of ["1y", "3y", "10y", "20y", "30y"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("marks the active horizon button as selected", () => {
    renderWithProviders(<TimeHorizonSelector value={20} onChange={() => {}} />, {
      initialEntries: ["/forecast"],
    });
    const btn = screen.getByRole("button", { name: "20y" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onChange with the selected horizon", () => {
    const onChange = mock((v: ForecastHorizon) => v);
    renderWithProviders(<TimeHorizonSelector value={10} onChange={onChange} />, {
      initialEntries: ["/forecast"],
    });
    fireEvent.click(screen.getByRole("button", { name: "30y" }));
    expect(onChange).toHaveBeenCalledWith(30);
  });
});
