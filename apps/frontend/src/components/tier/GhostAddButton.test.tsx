import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import GhostAddButton from "./GhostAddButton";

describe("GhostAddButton", () => {
  it("renders '+ Add' text", () => {
    render(<GhostAddButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /\+ add/i })).toBeTruthy();
  });

  it("calls onClick when clicked", () => {
    let called = false;
    render(
      <GhostAddButton
        onClick={() => {
          called = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(called).toBe(true);
  });

  it("is disabled when disabled prop is true", () => {
    render(<GhostAddButton onClick={() => {}} disabled />);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
