import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { GiftPersonDetailPanel } from "./GiftPersonDetailPanel";

mock.module("@/hooks/usePlanner", () => ({
  useGiftPerson: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useCreateGiftEvent: () => ({ mutate: () => {}, isPending: false }),
  useDeleteGiftEvent: () => ({ mutate: () => {}, isPending: false }),
  useUpsertGiftYearRecord: () => ({ mutate: () => {}, isPending: false }),
  useUpdateGiftPerson: () => ({ mutate: () => {}, isPending: false }),
}));

describe("GiftPersonDetailPanel error state", () => {
  it("shows PanelError when gift person query fails", () => {
    renderWithProviders(
      <GiftPersonDetailPanel personId="p-1" year={2026} onBack={() => {}} isReadOnly={false} />,
      { initialEntries: ["/planner"] }
    );
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
