import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";
import { useFocusParam } from "../useFocusParam";
import { useAddParam } from "../useAddParam";

function FocusProbe({ onFocus }: { onFocus: (id: string) => void }) {
  useFocusParam(onFocus);
  return null;
}

function AddProbe({ onAdd }: { onAdd: (kind: string) => void }) {
  useAddParam(onAdd);
  return null;
}

describe("useFocusParam", () => {
  it("calls onFocus with the id from ?focus=<id>", () => {
    const spy = vi.fn();
    render(
      <MemoryRouter initialEntries={["/x?focus=abc"]}>
        <Routes>
          <Route path="/x" element={<FocusProbe onFocus={spy} />} />
        </Routes>
      </MemoryRouter>
    );
    expect(spy).toHaveBeenCalledWith("abc");
  });

  it("does not call onFocus when param absent", () => {
    const spy = vi.fn();
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route path="/x" element={<FocusProbe onFocus={spy} />} />
        </Routes>
      </MemoryRouter>
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("useAddParam", () => {
  it("calls onAdd with the kind from ?add=<kind>", () => {
    const spy = vi.fn();
    render(
      <MemoryRouter initialEntries={["/x?add=asset"]}>
        <Routes>
          <Route path="/x" element={<AddProbe onAdd={spy} />} />
        </Routes>
      </MemoryRouter>
    );
    expect(spy).toHaveBeenCalledWith("asset");
  });
});
