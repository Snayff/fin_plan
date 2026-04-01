import { describe, it, expect, vi } from "bun:test";
import { render, screen } from "@testing-library/react";
import { NudgeCard } from "./NudgeCard";

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => <div data-animated {...props}>{children}</div> },
}));

describe("NudgeCard", () => {
  it("renders message text", () => {
    render(<NudgeCard message="Your yearly bill is due soon" />);
    expect(screen.getByText("Your yearly bill is due soon")).toBeTruthy();
  });

  it("wraps content in a motion.div for entrance animation", () => {
    const { container } = render(<NudgeCard message="Test message" />);
    expect(container.querySelector("[data-animated]")).toBeTruthy();
  });
});
