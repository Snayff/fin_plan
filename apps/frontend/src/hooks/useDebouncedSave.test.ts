import { describe, it, expect, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedSave } from "./useDebouncedSave";

describe("useDebouncedSave", () => {
  it("coalesces multiple rapid updates into a single save call", async () => {
    const save = mock((data: Record<string, unknown>) => Promise.resolve(data));
    const { result } = renderHook(() => useDebouncedSave(save, 50));

    act(() => {
      result.current.queue({ name: "A" });
      result.current.queue({ amount: 100 });
      result.current.queue({ name: "B" });
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0]).toEqual({ name: "B", amount: 100 });
  });

  it("flushes immediately when flush() is called", async () => {
    const save = mock((data: Record<string, unknown>) => Promise.resolve(data));
    const { result } = renderHook(() => useDebouncedSave(save, 500));

    act(() => {
      result.current.queue({ name: "A" });
    });
    await act(async () => {
      await result.current.flush();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0]).toEqual({ name: "A" });
  });
});
