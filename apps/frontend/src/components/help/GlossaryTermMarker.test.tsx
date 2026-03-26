import { describe, it, expect } from "bun:test";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { GlossaryPopoverProvider } from "./GlossaryPopoverContext";
import { GlossaryTermMarker } from "./GlossaryTermMarker";

function renderMarker(entryId = "waterfall") {
  return renderWithProviders(
    <GlossaryPopoverProvider>
      <p>
        The <GlossaryTermMarker entryId={entryId}>Waterfall</GlossaryTermMarker> model is central.
      </p>
    </GlossaryPopoverProvider>,
    { initialEntries: ["/overview"] }
  );
}

describe("GlossaryTermMarker", () => {
  it("renders children with dotted underline span", () => {
    renderMarker();
    const trigger = screen.getByText("Waterfall");
    expect(trigger.tagName).toBe("SPAN");
    expect(trigger.className).toContain("border-dotted");
  });

  it("shows popover content after mouseenter", async () => {
    renderMarker();
    const trigger = screen.getByText("Waterfall");
    await act(async () => {
      fireEvent.mouseEnter(trigger);
      await new Promise((r) => setTimeout(r, 200)); // wait for 150ms delay
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/income at the top/i)).toBeTruthy();
  });

  it("popover closes on Escape key", async () => {
    renderMarker();
    const trigger = screen.getByText("Waterfall");
    await act(async () => {
      fireEvent.mouseEnter(trigger);
      await new Promise((r) => setTimeout(r, 200));
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows Learn more link navigating to /help", async () => {
    renderMarker();
    const trigger = screen.getByText("Waterfall");
    await act(async () => {
      fireEvent.mouseEnter(trigger);
      await new Promise((r) => setTimeout(r, 200));
    });
    const learnMore = screen.getByText("Learn more");
    expect(learnMore.closest("a")?.getAttribute("href")).toContain("/help");
  });
});
