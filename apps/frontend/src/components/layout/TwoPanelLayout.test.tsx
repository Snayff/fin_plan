import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TwoPanelLayout } from "./TwoPanelLayout";

type MqlListener = (e: MediaQueryListEvent) => void;
const originalMatchMedia = window.matchMedia;

function setViewport(mobile: boolean) {
  const listeners = new Set<MqlListener>();
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: mobile,
      media: query,
      onchange: null,
      addEventListener: (event: string, listener: MqlListener) => {
        if (event === "change") listeners.add(listener);
      },
      removeEventListener: (event: string, listener: MqlListener) => {
        if (event === "change") listeners.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

describe("TwoPanelLayout responsive behaviour", () => {
  beforeEach(() => setViewport(false));
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test("desktop: renders both panels regardless of selectedKey", () => {
    setViewport(false);
    render(
      <TwoPanelLayout
        left={<div data-testid="left">L</div>}
        right={<div data-testid="right">R</div>}
        selectedKey={null}
      />
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  test("mobile + selectedKey == null: renders only left", () => {
    setViewport(true);
    render(
      <TwoPanelLayout
        left={<div data-testid="left">L</div>}
        right={<div data-testid="right">R</div>}
        selectedKey={null}
      />
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.queryByTestId("right")).not.toBeInTheDocument();
  });

  test("mobile + selectedKey != null: renders only right", () => {
    setViewport(true);
    render(
      <TwoPanelLayout
        left={<div data-testid="left">L</div>}
        right={<div data-testid="right">R</div>}
        selectedKey="some-id"
      />
    );
    expect(screen.queryByTestId("left")).not.toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  test("mobile + selectedKey != null but right is null: shows placeholder", () => {
    setViewport(true);
    render(
      <TwoPanelLayout
        left={<div data-testid="left">L</div>}
        right={null}
        selectedKey="some-id"
        rightPlaceholder="Pick something"
      />
    );
    expect(screen.getByText("Pick something")).toBeInTheDocument();
  });

  test("selectedKey defaults to null when omitted (left-only on mobile)", () => {
    setViewport(true);
    render(
      <TwoPanelLayout
        left={<div data-testid="left">L</div>}
        right={<div data-testid="right">R</div>}
      />
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.queryByTestId("right")).not.toBeInTheDocument();
  });
});
