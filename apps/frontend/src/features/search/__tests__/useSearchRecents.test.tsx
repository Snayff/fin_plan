import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchRecents, type RecentEntry } from "../useSearchRecents";

const entry = (id: string, kind: RecentEntry["kind"] = "nav"): RecentEntry => ({
  id,
  kind,
  label: `Entry ${id}`,
  subtitle: "x",
  route: "/x",
});

describe("useSearchRecents", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty list for a user with no recents", () => {
    const { result } = renderHook(() => useSearchRecents("user-1"));
    expect(result.current.list).toEqual([]);
  });

  it("pushes entries to the top and caps at 3", () => {
    const { result } = renderHook(() => useSearchRecents("user-1"));
    act(() => result.current.push(entry("a")));
    act(() => result.current.push(entry("b")));
    act(() => result.current.push(entry("c")));
    act(() => result.current.push(entry("d")));
    expect(result.current.list.map((e) => e.id)).toEqual(["d", "c", "b"]);
  });

  it("dedupes by (kind,id) and moves existing entry to top", () => {
    const { result } = renderHook(() => useSearchRecents("user-1"));
    act(() => result.current.push(entry("a")));
    act(() => result.current.push(entry("b")));
    act(() => result.current.push(entry("a")));
    expect(result.current.list.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("keeps recents isolated per user", () => {
    const { result: u1 } = renderHook(() => useSearchRecents("user-1"));
    act(() => u1.current.push(entry("a")));
    const { result: u2 } = renderHook(() => useSearchRecents("user-2"));
    expect(u2.current.list).toEqual([]);
  });
});
