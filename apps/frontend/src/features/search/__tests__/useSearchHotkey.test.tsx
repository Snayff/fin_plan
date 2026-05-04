import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSearchHotkey } from "../useSearchHotkey";

function fireKey(key: string, meta = false, ctrl = false) {
  const ev = new KeyboardEvent("keydown", { key, metaKey: meta, ctrlKey: ctrl });
  window.dispatchEvent(ev);
}

describe("useSearchHotkey", () => {
  it("invokes callback on Ctrl+K", () => {
    const cb = vi.fn();
    renderHook(() => useSearchHotkey(cb));
    fireKey("k", false, true);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("invokes callback on Cmd+K", () => {
    const cb = vi.fn();
    renderHook(() => useSearchHotkey(cb));
    fireKey("k", true, false);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not invoke on plain 'k'", () => {
    const cb = vi.fn();
    renderHook(() => useSearchHotkey(cb));
    fireKey("k");
    expect(cb).not.toHaveBeenCalled();
  });
});
