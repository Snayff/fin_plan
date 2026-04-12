import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigPeoplePanel } from "./ConfigPeoplePanel";

const createMock = mock(() => Promise.resolve({}));
const updateMock = mock(() => Promise.resolve({}));
const deleteMock = mock(() => Promise.resolve());

mock.module("@/hooks/useGifts", () => ({
  useConfigPeople: (filter: string) => ({
    isLoading: false,
    data: [
      { id: "p1", name: "Mum", memberId: "m1" },
      { id: "p2", name: "Dad", memberId: null },
    ].filter((p) =>
      filter === "household"
        ? p.memberId !== null
        : filter === "non-household"
          ? p.memberId === null
          : true
    ),
  }),
  useCreateGiftPerson: () => ({ mutate: createMock, isPending: false }),
  useUpdateGiftPerson: () => ({ mutate: updateMock, isPending: false }),
  useDeleteGiftPerson: () => ({ mutate: deleteMock, isPending: false }),
}));

describe("ConfigPeoplePanel", () => {
  it("renders all people by default", () => {
    render(<ConfigPeoplePanel readOnly={false} />);
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
  });

  it("filters to household-linked when filter set to household", () => {
    render(<ConfigPeoplePanel readOnly={false} />);
    fireEvent.click(screen.getByRole("button", { name: /^household$/i }));
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(screen.queryByText("Dad")).toBeNull();
  });

  it("invokes createGiftPerson when add row submitted", () => {
    render(<ConfigPeoplePanel readOnly={false} />);
    const input = screen.getByPlaceholderText(/add a person/i);
    fireEvent.change(input, { target: { value: "Sis" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(createMock).toHaveBeenCalledWith({ name: "Sis" });
  });
});
