// apps/frontend/src/hooks/useAutoSave.test.ts
import { describe, it, expect, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave";

function createSaveMock(result: "success" | "error" = "success") {
  return mock(async (value: string) => {
    if (result === "error") throw new Error("fail");
    return value;
  });
}

describe("useAutoSave", () => {
  it("debounces text saves by 600ms", async () => {
    const save = createSaveMock();
    const { result } = renderHook(() =>
      useAutoSave({ initialValue: "a", onSave: save, debounceMs: 600 })
    );

    act(() => result.current.setValue("b"));
    act(() => result.current.setValue("c"));
    expect(save).toHaveBeenCalledTimes(0);

    await new Promise((r) => setTimeout(r, 700));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toBe("c");
  });

  it("saves immediately when debounceMs is 0", async () => {
    const save = createSaveMock();
    const { result } = renderHook(() =>
      useAutoSave({ initialValue: false, onSave: save, debounceMs: 0 })
    );

    act(() => result.current.setValue(true));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0]).toBe(true);
  });

  it("does not save when value equals the last-saved value", async () => {
    const save = createSaveMock();
    const { result } = renderHook(() =>
      useAutoSave({ initialValue: "a", onSave: save, debounceMs: 0 })
    );
    act(() => result.current.setValue("a"));
    await new Promise((r) => setTimeout(r, 50));
    expect(save).toHaveBeenCalledTimes(0);
  });

  it("transitions status to saved on success", async () => {
    const save = createSaveMock("success");
    const { result } = renderHook(() =>
      useAutoSave({ initialValue: "a", onSave: save, debounceMs: 0 })
    );
    act(() => result.current.setValue("b"));
    await waitFor(() => expect(result.current.status).toBe("saved"));
  });

  it("reverts value and exposes error on failure", async () => {
    const save = createSaveMock("error");
    const { result } = renderHook(() =>
      useAutoSave({ initialValue: "a", onSave: save, debounceMs: 0 })
    );
    act(() => result.current.setValue("b"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.value).toBe("a");
    expect(result.current.errorMessage).toBe("Couldn't save — try again");
  });

  it("clears error status when user edits again", async () => {
    const save = createSaveMock("error");
    const { result } = renderHook(() =>
      useAutoSave({ initialValue: "a", onSave: save, debounceMs: 0 })
    );
    act(() => result.current.setValue("b"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    act(() => result.current.setValue("c"));
    expect(result.current.status).toBe("idle");
  });
});
