/**
 * Design-system drift prevention — structural invariants across pages.
 *
 * Source of truth: docs/2. design/design-system.md § 3.1 and CLAUDE.md "Panel Layout".
 * Complements the ESLint rules in eslint.config.js — lint covers className primitives,
 * this file covers composition invariants (PageHeader presence, wrapper delegation,
 * right-panel add-button pattern) that AST selectors can't express reliably.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

const PAGES_DIR = join(import.meta.dir, "pages");
const COMPONENTS_DIR = join(import.meta.dir, "components");

const EXEMPT_PAGES = new Set<string>([
  "WelcomePage.tsx",
  "DesignRenewPage.tsx",
  "FullWaterfallPage.tsx",
  "auth/LoginPage.tsx",
  "auth/RegisterPage.tsx",
  "auth/AcceptInvitePage.tsx",
]);

function normalise(p: string): string {
  return p.replace(/\\/g, "/");
}

function discoverPages(): string[] {
  const glob = new Glob("**/*Page.tsx");
  return Array.from(glob.scanSync(PAGES_DIR))
    .map(normalise)
    .filter((f) => !f.endsWith(".test.tsx"))
    .sort();
}

const allPages = discoverPages();
const nonExemptPages = allPages.filter((f) => !EXEMPT_PAGES.has(f));

function readPage(relPath: string): string {
  return readFileSync(join(PAGES_DIR, relPath), "utf8");
}

function readComponent(relPath: string): string {
  return readFileSync(join(COMPONENTS_DIR, relPath), "utf8");
}

describe("design system — page invariants", () => {
  it("discovered at least 5 non-exempt pages (sanity check)", () => {
    expect(nonExemptPages.length).toBeGreaterThanOrEqual(5);
  });

  for (const relPath of nonExemptPages) {
    describe(relPath, () => {
      const source = readPage(relPath);
      const isTierWrapper = /<TierPage\b/.test(source);
      const isSettingsWrapper =
        /<SettingsLeftPanel\b/.test(source) || /<SettingsRightPanel\b/.test(source);
      const definesInlineLeftPanel = /flex flex-col h-full/.test(source) && !isTierWrapper;

      it("does not use min-h-screen", () => {
        expect(source).not.toMatch(/className="[^"]*\bmin-h-screen\b/);
      });

      it("uses TwoPanelLayout directly or via TierPage / Settings wrappers", () => {
        const direct = /\bTwoPanelLayout\b/.test(source);
        expect(direct || isTierWrapper || isSettingsWrapper).toBe(true);
      });

      it("does not use border-dashed", () => {
        expect(source).not.toMatch(/className="[^"]*\bborder-dashed\b/);
      });

      if (definesInlineLeftPanel) {
        it("inline left panel: includes PageHeader and a flex-1 overflow-y-auto scroll region", () => {
          expect(source).toMatch(/<PageHeader\b/);
          expect(source).toMatch(/className="[^"]*\bflex-1\b[^"]*\boverflow-y-auto\b/);
        });

        it("inline left panel: PageHeader appears before the scroll region", () => {
          const headerIdx = source.search(/<PageHeader\b/);
          const scrollIdx = source.search(/className="[^"]*\bflex-1\b[^"]*\boverflow-y-auto\b/);
          expect(headerIdx).toBeGreaterThanOrEqual(0);
          expect(scrollIdx).toBeGreaterThan(headerIdx);
        });
      }
    });
  }
});

const RIGHT_PANEL_CONTAINERS = [
  "tier/ItemArea.tsx",
  "overview/IncomeTypePanel.tsx",
  "overview/CommittedBillsPanel.tsx",
  "assets/AssetItemArea.tsx",
  "assets/AccountItemArea.tsx",
];

describe("design system — right-panel add buttons use GhostAddButton", () => {
  for (const relPath of RIGHT_PANEL_CONTAINERS) {
    it(`${relPath}: if a header add-affordance is present, uses GhostAddButton`, () => {
      const source = readComponent(relPath);
      const hasAddAffordance =
        /\binitialIsAdding\b/.test(source) ||
        /\bonAddClick\b/.test(source) ||
        /\bsetIsAddingItem\b/.test(source) ||
        /\bsetIsAdding\b/.test(source);
      if (hasAddAffordance) {
        expect(source).toMatch(/\bGhostAddButton\b/);
      }
    });
  }
});
