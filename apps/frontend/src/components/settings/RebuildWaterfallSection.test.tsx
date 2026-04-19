import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockNavigate = mock(() => {});
const mockMutate = mock(
  (_: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  }
);

mock.module("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

mock.module("sonner", () => ({
  toast: {
    success: mock(() => {}),
    error: mock(() => {}),
  },
}));

mock.module("@/hooks/useWaterfall", () => ({
  useDeleteAllWaterfall: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

const { RebuildWaterfallSection } = await import("./RebuildWaterfallSection");

describe("RebuildWaterfallSection", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  it("renders the rebuild button", () => {
    render(<RebuildWaterfallSection />);
    expect(screen.getByRole("button", { name: /rebuild from scratch/i })).toBeDefined();
  });

  it("shows confirmation dialog when rebuild button is clicked", () => {
    render(<RebuildWaterfallSection />);
    fireEvent.click(screen.getByRole("button", { name: /rebuild from scratch/i }));
    expect(screen.getByText(/rebuild from scratch\?/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /yes, clear everything/i })).toBeDefined();
  });

  it("navigates to /waterfall after confirmed reset", async () => {
    render(<RebuildWaterfallSection />);
    fireEvent.click(screen.getByRole("button", { name: /rebuild from scratch/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, clear everything/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/waterfall");
    });
  });

  it("closes dialog without navigating on cancel", () => {
    render(<RebuildWaterfallSection />);
    fireEvent.click(screen.getByRole("button", { name: /rebuild from scratch/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
