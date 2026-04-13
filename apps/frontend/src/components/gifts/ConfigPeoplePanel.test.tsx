import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigPeoplePanel } from "./ConfigPeoplePanel";

const createMock = mock(() => Promise.resolve({}));
const deleteMock = mock(() => Promise.resolve());

const TEST_PEOPLE = [
  {
    id: "p1",
    name: "Mum",
    memberId: "m1",
    notes: null,
    sortOrder: 0,
    plannedCount: 2,
    boughtCount: 1,
  },
  {
    id: "p2",
    name: "Dad",
    memberId: null,
    notes: null,
    sortOrder: 1,
    plannedCount: 1,
    boughtCount: 0,
  },
];

mock.module("@/hooks/useGifts", () => ({
  useConfigPeople: () => ({
    isLoading: false,
    data: TEST_PEOPLE,
  }),
  useCreateGiftPerson: () => ({ mutate: createMock, isPending: false }),
  useUpdateGiftPerson: () => ({ mutate: mock(() => {}), isPending: false }),
  useDeleteGiftPerson: () => ({ mutate: deleteMock, isPending: false }),
}));

describe("ConfigPeoplePanel", () => {
  it("renders all people by default", () => {
    render(<ConfigPeoplePanel readOnly={false} year={2026} />);
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
  });

  it("shows the header with title and count", () => {
    render(<ConfigPeoplePanel readOnly={false} year={2026} />);
    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("2 people")).toBeInTheDocument();
  });

  it("shows filter tabs with counts", () => {
    render(<ConfigPeoplePanel readOnly={false} year={2026} />);
    const buttons = screen.getAllByRole("button");
    const filterButtons = buttons.filter((b) =>
      /^(All|Household|Non-household)\s/.test(b.textContent ?? "")
    );
    expect(filterButtons).toHaveLength(3);
  });

  it("filters to household-linked when filter set to household", () => {
    render(<ConfigPeoplePanel readOnly={false} year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: /^household/i }));
    expect(screen.getByText("Mum")).toBeInTheDocument();
    expect(screen.queryByText("Dad")).toBeNull();
  });

  it("shows planned and bought counts per person", () => {
    render(<ConfigPeoplePanel readOnly={false} year={2026} />);
    expect(screen.getByText("2 planned")).toBeInTheDocument();
    expect(screen.getByText("1 bought")).toBeInTheDocument();
  });

  it("shows + Add button and invokes create on submit", () => {
    render(<ConfigPeoplePanel readOnly={false} year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add/i }));
    const input = screen.getByPlaceholderText(/e\.g\. Mum/i);
    fireEvent.change(input, { target: { value: "Sis" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(createMock).toHaveBeenCalledWith({ name: "Sis" });
  });

  it("hides add button and delete in readOnly mode", () => {
    render(<ConfigPeoplePanel readOnly={true} year={2026} />);
    expect(screen.queryByRole("button", { name: /\+ Add/i })).toBeNull();
    expect(screen.queryByText("Delete")).toBeNull();
  });
});
