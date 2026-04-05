import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemStatusFilter from "./ItemStatusFilter";

describe("ItemStatusFilter", () => {
  it("renders three filter buttons with counts", () => {
    render(
      <ItemStatusFilter
        counts={{ active: 5, future: 2, expired: 1 }}
        selected={new Set(["active"])}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Future")).toBeTruthy();
    expect(screen.getByText("Expired")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("supports multi-select", () => {
    let selected = new Set<string>(["active"]);
    const onChange = (s: Set<string>) => {
      selected = s;
    };

    render(
      <ItemStatusFilter
        counts={{ active: 5, future: 2, expired: 1 }}
        selected={selected as any}
        onChange={onChange as any}
      />
    );

    fireEvent.click(screen.getByText("Future"));
    expect(selected.has("future")).toBe(true);
    expect(selected.has("active")).toBe(true);
  });
});
