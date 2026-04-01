import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { GhostedListEmpty } from "./GhostedListEmpty";

describe("GhostedListEmpty addable variant", () => {
  it("renders ctaHeading as a visible heading", () => {
    render(
      <GhostedListEmpty
        ctaHeading="What income do you earn?"
        ctaText="Employment income, take-home pay"
        onCtaClick={() => {}}
      />
    );
    expect(screen.getByText("What income do you earn?")).toBeTruthy();
    expect(screen.getByText("Employment income, take-home pay")).toBeTruthy();
  });

  it("does not render skeleton rows when ctaHeading is provided", () => {
    const { container } = render(
      <GhostedListEmpty
        ctaHeading="What income do you earn?"
        ctaText="Employment income, take-home pay"
        onCtaClick={() => {}}
        rowCount={3}
      />
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
  });

  it("still renders skeleton rows in informational variant (showCta=false)", () => {
    const { container } = render(
      <GhostedListEmpty
        ctaText="No upcoming events"
        showCta={false}
        rowCount={3}
      />
    );
    const ghostRows = container.querySelectorAll('[style*="opacity"]');
    expect(ghostRows.length).toBeGreaterThan(0);
  });
});
