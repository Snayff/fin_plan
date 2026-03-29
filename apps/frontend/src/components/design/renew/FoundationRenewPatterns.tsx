// Update this file when renew design tokens are modified.
// Token source: src/config/design-tokens.ts
// Token rules: docs/renew-finplan/design-system.md
import { ColorSwatch } from "./ColorSwatch";
import { PatternSection } from "./PatternSection";

const tierColors = [
  {
    name: "Tier: Income",
    cssVar: "--tier-income",
    tailwindClass: "text-tier-income / bg-tier-income",
    hex: "#0ea5e9",
    description: "Income tier — energetic, electric blue. The source of the waterfall.",
  },
  {
    name: "Tier: Committed",
    cssVar: "--tier-committed",
    tailwindClass: "text-tier-committed / bg-tier-committed",
    hex: "#6366f1",
    description: "Committed Spend tier — settled indigo. Neutral obligation.",
  },
  {
    name: "Tier: Discretionary",
    cssVar: "--tier-discretionary",
    tailwindClass: "text-tier-discretionary / bg-tier-discretionary",
    hex: "#a855f7",
    description: "Discretionary tier — expressive purple. Chosen spend.",
  },
  {
    name: "Tier: Surplus",
    cssVar: "--tier-surplus",
    tailwindClass: "text-tier-surplus / bg-tier-surplus",
    hex: "#4adcd0",
    description: "Surplus tier — rewarding teal-mint. The answer at the bottom of the waterfall.",
  },
];

const statusColors = [
  {
    name: "Error",
    cssVar: "--destructive",
    tailwindClass: "bg-destructive / text-destructive",
    hex: "#ef4444",
    description:
      "App errors only — validation failures, system errors, destructive action confirmation. Never for financial shortfalls or negative balances.",
  },
  {
    name: "Success",
    cssVar: "--success",
    tailwindClass: "bg-success / text-success",
    hex: "#22c55e",
    description:
      'UI confirmations only — saved, completed, synced. Never for positive balances or financial "good" states.',
  },
];

const actionColors = [
  {
    name: "Action (violet)",
    cssVar: "--primary",
    tailwindClass: "bg-primary",
    hex: "#7c3aed",
    description:
      "Buttons, focus rings, CTAs, primary interactive elements. Electric violet — the app's action colour.",
  },
  {
    name: "Page Accent (soft violet)",
    cssVar: "--page-accent",
    tailwindClass: "text-page-accent",
    hex: "#8b5cf6",
    description:
      "Breadcrumbs, section headers, nav indicators on non-tier pages. Bluer and cooler than Discretionary — never reads as a tier signal.",
  },
];

const attentionColors = [
  {
    name: "Attention (amber)",
    cssVar: "--attention",
    tailwindClass: "text-attention / bg-attention",
    hex: "#f59e0b",
    description:
      'The universal "noteworthy" signal — staleness dots, staleness text, cashflow attention, nudge dots. One colour, one pattern. Does not judge, it highlights.',
  },
  {
    name: "Attention BG",
    cssVar: "--attention-bg",
    tailwindClass: "bg-attention-bg",
    hex: "rgba(245,158,11,0.04)",
    description: "Nudge card background tint only.",
  },
  {
    name: "Attention Border",
    cssVar: "--attention-border",
    tailwindClass: "border-attention-border",
    hex: "rgba(245,158,11,0.08)",
    description: "Nudge card border only.",
  },
];

const calloutGradients = [
  {
    name: "Callout Primary",
    from: "#0ea5e9",
    to: "#a855f7",
    cssVars: "--callout-primary-from / --callout-primary-to",
    description:
      "Hero emphasis, key phrases, primary standout moments. Applied via background-clip: text.",
  },
  {
    name: "Callout Secondary",
    from: "#a855f7",
    to: "#4adcd0",
    cssVars: "--callout-secondary-from / --callout-secondary-to",
    description: "Secondary emphasis, variety.",
  },
];

const surfaceColors = [
  {
    name: "Background",
    cssVar: "--background",
    tailwindClass: "bg-background",
    hex: "#080a14",
    description:
      "Main app background — deep navy with blue undertone. Never a plain solid; ambient radial glows add depth.",
  },
  {
    name: "Surface (card)",
    cssVar: "--card",
    tailwindClass: "bg-card",
    hex: "#0d1120",
    description: "Cards, panels, sidebars — one step lighter than background.",
  },
  {
    name: "Surface Elevated",
    cssVar: "--surface-elevated",
    tailwindClass: "bg-surface-elevated",
    hex: "#141b2e",
    description: "Modals, popovers, selected rows.",
  },
  {
    name: "Surface Overlay",
    cssVar: "--surface-overlay",
    tailwindClass: "bg-surface-overlay",
    hex: "#1c2540",
    description: "Dropdowns, tooltips, top-layer elements.",
  },
  {
    name: "Border",
    cssVar: "--border",
    tailwindClass: "border-border",
    hex: "#1a1f35",
    description: "Dividers, input borders, panel separators.",
  },
  {
    name: "Text primary",
    cssVar: "--foreground",
    tailwindClass: "text-foreground",
    hex: "rgba(238,242,255,0.92)",
    description: "Headlines, key values, primary labels.",
  },
  {
    name: "Text secondary",
    cssVar: "--text-secondary",
    tailwindClass: "text-text-secondary",
    hex: "rgba(238,242,255,0.65)",
    description: "Item names, descriptions, body text.",
  },
  {
    name: "Text tertiary",
    cssVar: "--text-tertiary",
    tailwindClass: "text-text-tertiary",
    hex: "rgba(238,242,255,0.40)",
    description: "Metadata, helper text, timestamps.",
  },
  {
    name: "Text muted",
    cssVar: "--text-muted",
    tailwindClass: "text-text-muted",
    hex: "rgba(238,242,255,0.25)",
    description: "Placeholders, disabled text, divider labels.",
  },
];

const waterfallTypeSamples = [
  {
    label: "3xl / 30px · semibold · numeric",
    className: "text-3xl font-semibold font-numeric text-tier-income tabular-nums",
    text: "\u00A35,148",
    context: "Right panel headline — selected item value in detail view",
  },
  {
    label: "2xl / 24px · bold · numeric",
    className: "text-2xl font-bold font-numeric text-tier-surplus tabular-nums",
    text: "\u00A3270",
    context: "Surplus value — the answer at the bottom of the waterfall",
  },
  {
    label: "lg / 18px · semibold · numeric",
    className: "text-lg font-semibold font-numeric tabular-nums",
    text: "\u00A38,856",
    context: "Tier total value",
  },
  {
    label: "lg · extrabold · heading · uppercase",
    className: "text-lg font-extrabold font-heading uppercase tracking-tier text-tier-income",
    text: "INCOME",
    context: "Tier heading — Outfit, weight 800, solid tier colour, letter-spacing 0.09em",
  },
  {
    label: "base / 16px · medium · body",
    className: "text-base font-medium font-body",
    text: "Josh Salary",
    context: "Row item label (Nunito Sans)",
  },
  {
    label: "base / 16px · normal · numeric",
    className: "text-base font-numeric tabular-nums",
    text: "\u00A35,148",
    context: "Row item value (JetBrains Mono, tabular numerals)",
  },
  {
    label: "xs / 12px · normal · body",
    className: "text-xs font-body text-text-tertiary",
    text: "Last reviewed: 14 months ago",
    context: "Metadata — staleness age, dates, helper text (Nunito Sans)",
  },
];

const spacingSamples = [
  { token: "1", px: "4px", tailwind: "p-1 / gap-1 / m-1 — half-grid unit" },
  { token: "2", px: "8px", tailwind: "p-2 / gap-2 / m-2 — 1 grid unit" },
  { token: "3", px: "12px", tailwind: "p-3 / gap-3 / m-3 — 1.5 grid units" },
  { token: "4", px: "16px", tailwind: "p-4 / gap-4 / m-4 — 2 grid units" },
  { token: "6", px: "24px", tailwind: "p-6 / gap-6 / m-6 — card padding default" },
  { token: "8", px: "32px", tailwind: "p-8 / gap-8 / m-8 — section separation" },
  { token: "12", px: "48px", tailwind: "p-12 / gap-12 / m-12" },
];

export function FoundationRenewPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Foundation</h2>
        <p className="text-sm text-text-secondary mb-2">
          Renew design system tokens. All values flow from{" "}
          <code className="text-xs bg-background border border-border px-1 rounded">
            src/config/design-tokens.ts
          </code>{" "}
          and are exposed as CSS variables in{" "}
          <code className="text-xs bg-background border border-border px-1 rounded">index.css</code>
          .
        </p>
      </div>

      <PatternSection
        id="renew-tier-colors"
        title="Tier palette"
        description="One colour per waterfall tier. Each colour carries strict semantic meaning and must never be repurposed for status indicators, attention signals, buttons, or any non-tier UI element."
        useWhen={[
          "Tier headings (WaterfallTierRow)",
          "Selected state left border + hover backgrounds (at reduced opacity)",
          "Value text within tier context",
        ]}
        avoidWhen={[
          "Using tier colours for non-waterfall UI elements",
          "Repurposing for status indicators or attention signals",
          "Mixing tier colours within the same component",
        ]}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tierColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-status-colors"
        title="Status palette"
        description="Non-judgemental. Financial values are never colour-coded as good or bad. Error (red) is for app errors only. Success (green) is for UI confirmations only."
        useWhen={[
          "error: validation failures, system errors, destructive action confirmation",
          "success: saved, completed, synced — UI confirmations only",
        ]}
        avoidWhen={[
          "Financial shortfalls, negative balances, over-budget states (use attention amber instead)",
          'Positive balances, surplus amounts, financial "good" states',
        ]}
      >
        <div className="grid grid-cols-2 gap-4">
          {statusColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-action-colors"
        title="Action palette"
        description="Electric violet for primary actions. Soft violet for page-level accents on non-tier pages."
      >
        <div className="grid grid-cols-2 gap-4">
          {actionColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-attention"
        title="Attention"
        description="One colour, one pattern. Amber is the universal noteworthy signal. #f59e0b everywhere — staleness dots, staleness text, cashflow attention, nudge dots. The only variations are the subtle bg/border tints on nudge cards."
        useWhen={[
          "Staleness indicators (dot + text)",
          "Cashflow attention indicators",
          "Nudge card styling (bg/border variants)",
        ]}
        avoidWhen={[
          "Using for errors — attention is never red",
          "Varying the amber hue between contexts — one colour everywhere",
        ]}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {attentionColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-callout-gradients"
        title="Callout gradients"
        description="Gradient text for engagement and special highlights. Applied via background-clip: text. Should feel special and inviting."
        useWhen={["Hero headlines, wordmark, key summary phrases, standout CTAs"]}
        avoidWhen={[
          "Warnings or attention items",
          "Informational alerts",
          "Tier headings (tiers use solid colour)",
        ]}
      >
        <div className="space-y-6">
          {calloutGradients.map((gradient) => (
            <div key={gradient.name} className="flex flex-col gap-2">
              <span
                className="text-2xl font-heading font-extrabold w-fit"
                style={{
                  background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {gradient.name}
              </span>
              <div>
                <p className="text-xs text-muted-foreground font-mono">{gradient.cssVars}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {gradient.from} → {gradient.to}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{gradient.description}</p>
              </div>
            </div>
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-surface-colors"
        title="Surface tokens"
        description="Dark theme only. Three elevation levels with wide steps (~8–10 lightness points). No shadows — the dark theme relies on border contrast, not elevation shadows."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {surfaceColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-typography"
        title="Waterfall typography hierarchy"
        description="Three fonts, strict roles. Outfit communicates structure and hierarchy. Nunito Sans communicates content and detail. JetBrains Mono communicates 'this is a number worth reading.' Inter is not used anywhere."
        useWhen={[
          "font-heading (Outfit): tier names, headlines, wordmark, button labels, nav links, section headers",
          "font-body (Nunito Sans): item labels, descriptions, metadata, helper text, breadcrumbs",
          "font-numeric (JetBrains Mono): all monetary values, percentages, numerical data",
        ]}
        avoidWhen={[
          "Using Inter anywhere — it is not part of the design system",
          "Using Nunito Sans for monetary figures — JetBrains Mono is load-bearing for visual scanning",
          "Skipping tabular-nums on stacked number columns",
        ]}
      >
        <div className="space-y-4">
          {waterfallTypeSamples.map(({ label, className, text, context }) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-0"
            >
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-text-tertiary w-52 shrink-0 font-mono">{label}</span>
                <span className={className}>{text}</span>
              </div>
              <p className="text-xs text-text-tertiary ml-56">{context}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-lg bg-background border border-border text-sm">
          <p className="font-medium text-foreground mb-1">Heading tokens</p>
          <p className="text-text-secondary text-xs">
            Heading elements use tighter treatment: letter-spacing: -0.025em, line-height: 1.15.
            Defined in <code className="bg-card px-1 rounded">design-tokens.ts</code> — apply via{" "}
            <code className="bg-card px-1 rounded">tracking-heading</code> and{" "}
            <code className="bg-card px-1 rounded">leading-heading</code> when implemented.
          </p>
        </div>
      </PatternSection>

      <PatternSection
        id="renew-spacing"
        title="Spacing"
        description="8px grid. All spacing values are multiples of 4px (half-grid) or 8px (full grid). Generous by default — the calm-by-default principle applies to space as much as colour. Card padding: p-6 (24px)."
      >
        <div className="space-y-3">
          {spacingSamples.map(({ token, px, tailwind }) => (
            <div key={token} className="flex items-center gap-4">
              <div
                className="bg-primary/30 border border-primary rounded shrink-0"
                style={{ width: px, height: px, minWidth: px }}
              />
              <div className="flex gap-3 items-baseline">
                <span className="text-xs font-mono text-text-tertiary w-10">{px}</span>
                <span className="text-xs text-text-secondary">{tailwind}</span>
              </div>
            </div>
          ))}
        </div>
      </PatternSection>
    </div>
  );
}
