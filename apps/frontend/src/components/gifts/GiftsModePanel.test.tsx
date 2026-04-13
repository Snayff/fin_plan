import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { GiftsModePanel } from "./GiftsModePanel";

mock.module("./GiftPersonDetail", () => ({
  GiftPersonDetail: ({ personId }: any) => <div data-testid="detail">detail-{personId}</div>,
}));
mock.module("./GiftPersonList", () => ({
  GiftPersonList: ({ people, onSelect }: any) => (
    <ul>
      {people.map((p: any) => (
        <li key={p.id}>
          <button data-testid={`row-${p.id}`} onClick={() => onSelect(p.id)}>
            {p.name}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

describe("GiftsModePanel", () => {
  const people = [{ id: "p1", name: "Mum" }] as any;

  it("renders list initially (state 2)", () => {
    render(<GiftsModePanel people={people} year={2026} readOnly={false} />);
    expect(screen.getByTestId("row-p1")).toBeInTheDocument();
    expect(screen.queryByTestId("detail")).toBeNull();
  });

  it("drills into detail on row click (state 3)", async () => {
    render(<GiftsModePanel people={people} year={2026} readOnly={false} />);
    fireEvent.click(screen.getByTestId("row-p1"));
    expect(await screen.findByTestId("detail")).toHaveTextContent("detail-p1");
  });
});
