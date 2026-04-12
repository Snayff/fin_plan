import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigEventsPanel } from "./ConfigEventsPanel";

const createMock = mock(() => Promise.resolve({}));
const deleteMock = mock(() => Promise.resolve());

mock.module("@/hooks/useGifts", () => ({
  useConfigEvents: () => ({
    isLoading: false,
    data: [
      {
        id: "e1",
        name: "Christmas",
        dateType: "shared",
        isLocked: true,
        dateMonth: 12,
        dateDay: 25,
      },
      {
        id: "e2",
        name: "Wedding",
        dateType: "personal",
        isLocked: false,
        dateMonth: null,
        dateDay: null,
      },
    ],
  }),
  useCreateGiftEvent: () => ({ mutate: createMock, isPending: false }),
  useDeleteGiftEvent: () => ({ mutate: deleteMock, isPending: false }),
}));

describe("ConfigEventsPanel", () => {
  it("groups locked and custom events", () => {
    render(<ConfigEventsPanel readOnly={false} />);
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
    expect(screen.getByText(/custom/i)).toBeInTheDocument();
  });

  it("locked event is not deletable", () => {
    render(<ConfigEventsPanel readOnly={false} />);
    const xmasRow = screen.getByTestId("event-row-e1");
    expect(xmasRow.querySelector("button")).toBeNull();
  });

  it("create form requires date for shared-date events", () => {
    render(<ConfigEventsPanel readOnly={false} />);
    fireEvent.change(screen.getByPlaceholderText(/event name/i), {
      target: { value: "Halloween" },
    });
    fireEvent.click(screen.getByLabelText(/same date every year/i));
    fireEvent.change(screen.getByPlaceholderText(/month/i), { target: { value: "10" } });
    fireEvent.change(screen.getByPlaceholderText(/day/i), { target: { value: "31" } });
    fireEvent.click(screen.getByRole("button", { name: /add event/i }));
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Halloween", dateType: "shared", dateMonth: 10, dateDay: 31 })
    );
  });
});
