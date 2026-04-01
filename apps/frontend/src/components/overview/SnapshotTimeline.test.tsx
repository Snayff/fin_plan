import { describe, it, expect, mock, beforeAll } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { SnapshotTimeline } from "./SnapshotTimeline";

const mockSnapshots = [
  { id: "s1", name: "Jan 2025", isAuto: true, createdAt: "2025-01-01T00:00:00Z" },
  { id: "s2", name: "Mar 2025", isAuto: false, createdAt: "2025-03-15T00:00:00Z" },
];

let mockQueryResult = {
  data: undefined as typeof mockSnapshots | undefined,
  isLoading: false,
  isError: false,
  refetch: () => {},
};

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
  useSnapshot: () => ({ data: undefined }),
  useSnapshots: () => mockQueryResult,
}));

describe("SnapshotTimeline error state", () => {
  beforeAll(() => {
    mockQueryResult = { data: undefined, isLoading: false, isError: true, refetch: () => {} };
  });

  it("shows inline error when snapshots query fails", () => {
    renderWithProviders(
      <SnapshotTimeline
        selectedId={null}
        loadingId={null}
        isViewingSnapshot={false}
        onSelect={() => {}}
        onSelectNow={() => {}}
        onOpenCreate={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});

describe("SnapshotTimeline empty state", () => {
  beforeAll(() => {
    mockQueryResult = { data: [], isLoading: false, isError: false, refetch: () => {} };
  });

  it("shows 'No snapshots yet' and save button", () => {
    renderWithProviders(
      <SnapshotTimeline
        selectedId={null}
        loadingId={null}
        isViewingSnapshot={false}
        onSelect={() => {}}
        onSelectNow={() => {}}
        onOpenCreate={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByText("No snapshots yet")).toBeTruthy();
    expect(screen.getByText("+ Save snapshot")).toBeTruthy();
  });
});

describe("SnapshotTimeline with snapshots", () => {
  beforeAll(() => {
    mockQueryResult = {
      data: mockSnapshots,
      isLoading: false,
      isError: false,
      refetch: () => {},
    };
  });

  it("renders Now button", () => {
    renderWithProviders(
      <SnapshotTimeline
        selectedId={null}
        loadingId={null}
        isViewingSnapshot={false}
        onSelect={() => {}}
        onSelectNow={() => {}}
        onOpenCreate={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.getByText("Now")).toBeTruthy();
  });

  it("hides save button when isViewingSnapshot", () => {
    renderWithProviders(
      <SnapshotTimeline
        selectedId="s1"
        loadingId={null}
        isViewingSnapshot={true}
        onSelect={() => {}}
        onSelectNow={() => {}}
        onOpenCreate={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.queryByText("+ Save snapshot")).toBeNull();
  });

  it("left arrow button is not rendered at initial render (scrollLeft=0)", () => {
    renderWithProviders(
      <SnapshotTimeline
        selectedId={null}
        loadingId={null}
        isViewingSnapshot={false}
        onSelect={() => {}}
        onSelectNow={() => {}}
        onOpenCreate={() => {}}
      />,
      { initialEntries: ["/overview"] }
    );
    expect(screen.queryByText("◂")).toBeNull();
  });
});
