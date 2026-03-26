import { describe, it, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { GlossaryPopoverProvider } from "./GlossaryPopoverContext";
import { GlossaryDetailView } from "./GlossaryDetailView";
import { ConceptDetailView } from "./ConceptDetailView";

describe("GlossaryDetailView", () => {
  it("renders term heading and definition", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <GlossaryDetailView entryId="waterfall" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.getByRole("heading", { name: "Waterfall" })).toBeTruthy();
    expect(screen.getByText(/income at the top/i)).toBeTruthy();
  });

  it("renders Appears in metadata", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <GlossaryDetailView entryId="waterfall" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.getByText(/appears in/i)).toBeTruthy();
  });

  it("renders related concept links", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <GlossaryDetailView entryId="committed-spend" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.getByText("The Waterfall")).toBeTruthy();
  });
});

describe("ConceptDetailView", () => {
  it("renders concept title and summary", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <ConceptDetailView conceptId="waterfall" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.getByRole("heading", { name: "The Waterfall" })).toBeTruthy();
    expect(screen.getByText(/income flows in at the top/i)).toBeTruthy();
  });

  it("renders Why it matters section", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <ConceptDetailView conceptId="waterfall" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.getByText(/why it matters/i)).toBeTruthy();
  });

  it("renders See this in finplan link when present", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <ConceptDetailView conceptId="waterfall" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.getByText(/see this in finplan/i)).toBeTruthy();
  });

  it("omits See this in finplan link when not present", () => {
    renderWithProviders(
      <GlossaryPopoverProvider>
        <ConceptDetailView conceptId="net-worth" onNavigate={() => {}} />
      </GlossaryPopoverProvider>,
      { initialEntries: ["/help"] }
    );
    expect(screen.queryByText(/see this in finplan/i)).toBeNull();
  });
});
