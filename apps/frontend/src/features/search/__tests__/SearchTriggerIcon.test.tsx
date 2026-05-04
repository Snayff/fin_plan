import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchTriggerIcon } from "../SearchTriggerIcon";

describe("SearchTriggerIcon", () => {
  it("renders a button with a Search icon and tooltip label", () => {
    render(<SearchTriggerIcon onOpen={() => {}} />);
    const btn = screen.getByRole("button", { name: /search/i });
    expect(btn).toBeInTheDocument();
  });

  it("calls onOpen when clicked", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<SearchTriggerIcon onOpen={spy} />);
    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
