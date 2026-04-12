import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { YearRolloverBanner } from "./YearRolloverBanner";

const dismissMock = mock(() => Promise.resolve());
mock.module("@/hooks/useGifts", () => ({
  useDismissRollover: () => ({ mutate: dismissMock, isPending: false }),
}));

beforeEach(() => dismissMock.mockClear());

describe("YearRolloverBanner", () => {
  it("renders when pending", () => {
    render(<YearRolloverBanner year={2026} pending={true} />);
    expect(screen.getByText(/gift plan for 2026/i)).toBeInTheDocument();
  });

  it("renders nothing when not pending", () => {
    const { container } = render(<YearRolloverBanner year={2026} pending={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("dismiss invokes mutation with year", () => {
    render(<YearRolloverBanner year={2026} pending={true} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(dismissMock).toHaveBeenCalledWith(2026);
  });
});
