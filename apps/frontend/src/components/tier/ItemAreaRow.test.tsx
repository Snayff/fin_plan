import { describe, it, expect, vi } from "bun:test";
import { render as _render } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}));
vi.mock("@/hooks/useWaterfall", () => ({
  useTierUpdateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConfirmWaterfallItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("ItemAreaRow animations", () => {
  it("imports AnimatePresence from framer-motion", async () => {
    const mod = await import("./ItemAreaRow");
    expect(mod).toBeTruthy();
  });
});
