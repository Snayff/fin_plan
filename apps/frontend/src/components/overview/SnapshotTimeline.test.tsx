import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { SnapshotTimeline } from "./SnapshotTimeline";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
  useSnapshot: () => ({ data: undefined }),
  useSnapshots: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
}));

describe("SnapshotTimeline error state", () => {
  it("shows inline error when snapshots query fails", () => {
    renderWithProviders(
      <SnapshotTimeline
        selectedId={null}
        onSelect={() => {}}
        onSelectNow={() => {}}
        onOpenCreate={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
