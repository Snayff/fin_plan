// Update this file when renew design tokens are modified.
// Token source: src/config/design-tokens.ts
// Token rules: docs/renew-finplan/design-system.md
import { ColorSwatch } from '../ColorSwatch';
import { PatternSection } from '../PatternSection';

const tierColors = [
  {
    name: 'Tier: Income',
    cssVar: '--tier-income',
    tailwindClass: 'text-tier-income / bg-tier-income',
    hex: '#07BEB8',
    description: 'Income tier heading and accents. Income and Surplus share this teal — both represent positive flow.',
  },
  {
    name: 'Tier: Committed',
    cssVar: '--tier-committed',
    tailwindClass: 'text-tier-committed / bg-tier-committed',
    hex: '#8090C0',
    description: 'Committed Spend tier. Neutral blue-slate — obligatory, not negative.',
  },
  {
    name: 'Tier: Discretionary',
    cssVar: '--tier-discretionary',
    tailwindClass: 'text-tier-discretionary / bg-tier-discretionary',
    hex: '#E0B084',
    description: 'Discretionary tier. Warm amber — chosen, human.',
  },
  {
    name: 'Tier: Surplus',
    cssVar: '--tier-surplus',
    tailwindClass: 'text-tier-surplus / bg-tier-surplus',
    hex: '#07BEB8',
    description: 'Surplus row. Same teal as Income — both represent the positive side of the waterfall.',
  },
];

const statusColors = [
  {
    name: 'Income (positive)',
    cssVar: '--income',
    tailwindClass: 'bg-income / text-income',
    hex: '#07BEB8',
    description: 'Positive values, income signals, surplus-positive state. Replaces ledger-era "success".',
  },
  {
    name: 'Staleness (amber)',
    cssVar: '--staleness',
    tailwindClass: 'bg-staleness / text-staleness',
    hex: '#E0B084',
    description: 'Stale items, surplus below benchmark, cashflow warnings. Informational — never blocking. Replaces ledger-era "warning" (which was magenta).',
  },
  {
    name: 'Shortfall (red)',
    cssVar: '--destructive',
    tailwindClass: 'bg-destructive',
    hex: '#E5484D',
    description: 'Genuine shortfall in yearly bills cashflow. Also used for data loss / irreversible actions. Use sparingly.',
  },
];

const actionColors = [
  {
    name: 'Primary (orange)',
    cssVar: '--primary',
    tailwindClass: 'bg-primary',
    hex: '#FF7A18',
    description: 'Action buttons, CTAs, focus rings, nav active underline.',
  },
  {
    name: 'Brand (purple/rose)',
    cssVar: '--brand',
    tailwindClass: 'bg-brand / text-brand',
    hex: '#B38BA3',
    description: 'Identity elements. Planner section headings (Purchases, Gifts) use this token to distinguish Planner from the waterfall tier colours.',
  },
];

const surfaceColors = [
  {
    name: 'Background',
    cssVar: '--background',
    tailwindClass: 'bg-background',
    hex: '#191D32',
    description: 'Main app background.',
  },
  {
    name: 'Surface (card)',
    cssVar: '--card',
    tailwindClass: 'bg-card',
    hex: '#22263D',
    description: 'Cards, panels, popovers — one step lighter than background.',
  },
  {
    name: 'Border',
    cssVar: '--border',
    tailwindClass: 'border-border',
    hex: '#2F3452',
    description: 'Dividers, input borders, panel separators.',
  },
  {
    name: 'Text primary',
    cssVar: '--foreground',
    tailwindClass: 'text-foreground',
    hex: '#F2F3F7',
    description: 'Main content.',
  },
  {
    name: 'Text secondary',
    cssVar: '--text-secondary',
    tailwindClass: 'text-text-secondary',
    hex: '#C7CAD9',
    description: 'Supporting information.',
  },
  {
    name: 'Text tertiary',
    cssVar: '--text-tertiary',
    tailwindClass: 'text-text-tertiary',
    hex: '#9DA1B8',
    description: 'De-emphasised content, metadata, staleness age.',
  },
];

const waterfallTypeSamples = [
  {
    label: '3xl / 30px · semibold · mono',
    className: 'text-3xl font-semibold font-mono text-income tabular-nums',
    text: '£5,148',
    context: 'Right panel headline — selected item value in detail view',
  },
  {
    label: '2xl / 24px · bold · mono',
    className: 'text-2xl font-bold font-mono text-income tabular-nums',
    text: '£270',
    context: 'Surplus value — the answer at the bottom of the waterfall',
  },
  {
    label: 'lg / 18px · semibold · mono',
    className: 'text-lg font-semibold font-mono tabular-nums',
    text: '£8,856',
    context: 'Tier total value',
  },
  {
    label: 'lg / 18px · semibold · UI · uppercase',
    className: 'text-lg font-semibold uppercase tracking-wide text-tier-income',
    text: 'INCOME',
    context: 'Tier heading — colour varies by tier',
  },
  {
    label: 'base / 16px · normal · UI + mono',
    className: 'text-base',
    text: 'Josh Salary',
    context: 'Row item label (UI font)',
  },
  {
    label: 'base / 16px · normal · mono',
    className: 'text-base font-mono tabular-nums',
    text: '£5,148',
    context: 'Row item value (mono font, tabular numerals)',
  },
  {
    label: 'xs / 12px · normal · UI',
    className: 'text-xs text-text-tertiary',
    text: 'Last reviewed: 14 months ago',
    context: 'Metadata — staleness age, dates, helper text',
  },
];

const spacingSamples = [
  { token: '1', px: '4px', tailwind: 'p-1 / gap-1 / m-1 — half-grid unit' },
  { token: '2', px: '8px', tailwind: 'p-2 / gap-2 / m-2 — 1 grid unit' },
  { token: '3', px: '12px', tailwind: 'p-3 / gap-3 / m-3 — 1.5 grid units' },
  { token: '4', px: '16px', tailwind: 'p-4 / gap-4 / m-4 — 2 grid units' },
  { token: '6', px: '24px', tailwind: 'p-6 / gap-6 / m-6 — card padding default' },
  { token: '8', px: '32px', tailwind: 'p-8 / gap-8 / m-8 — section separation' },
  { token: '12', px: '48px', tailwind: 'p-12 / gap-12 / m-12' },
];

export function FoundationRenewPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Foundation</h2>
        <p className="text-sm text-text-secondary mb-2">
          Renew design system tokens. All values flow from{' '}
          <code className="text-xs bg-background border border-border px-1 rounded">
            src/config/design-tokens.ts
          </code>{' '}
          and are exposed as CSS variables in{' '}
          <code className="text-xs bg-background border border-border px-1 rounded">index.css</code>.
        </p>
        <p className="text-xs text-text-tertiary">
          Migration note: <code className="bg-background px-1 rounded">success</code> →{' '}
          <code className="bg-background px-1 rounded">income</code> ·{' '}
          <code className="bg-background px-1 rounded">warning</code> (magenta) →{' '}
          <code className="bg-background px-1 rounded">staleness</code> (warm amber) ·{' '}
          <code className="bg-background px-1 rounded">highlight</code> removed ·{' '}
          <code className="bg-background px-1 rounded">expense</code> removed
        </p>
      </div>

      <PatternSection
        id="renew-tier-colors"
        title="Tier palette"
        description="One accent colour per waterfall tier. Income and Surplus share the same teal — both represent positive flow. Committed is neutral blue-slate. Discretionary is warm amber — chosen, human."
        useWhen={['Tier headings (WaterfallTierRow)', 'Selected state border accents', 'Staleness count badges within a tier']}
        avoidWhen={['Using tier colours for non-waterfall UI', 'Mixing tier colours within the same component']}
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
        description="States, not tiers. Calm by default — teal and amber for informational signals, red only for genuine shortfalls and destructive actions."
        useWhen={[
          'income: positive values, income signals, surplus-positive',
          'staleness: stale items, surplus below benchmark — informational only',
          'destructive: genuine cashflow shortfall, data loss actions — sparingly',
        ]}
        avoidWhen={[
          'Using destructive for staleness, warnings, or anything less than a real problem',
          'Using staleness for errors — it is never an error colour',
        ]}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {statusColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-action-colors"
        title="Action palette"
        description="Orange for primary actions. Brand purple/rose for identity elements and the Planner page headings."
      >
        <div className="grid grid-cols-2 gap-4">
          {actionColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
      </PatternSection>

      <PatternSection
        id="renew-surface-colors"
        title="Surface tokens"
        description="Dark theme only. No light mode. Background → Surface (card) creates the one level of elevation used by cards and panels."
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
        description="Six levels, each a clear visual step. Two fonts: Inter (font-ui) for all labels and copy, JetBrains Mono (font-numeric) for all monetary values. Tabular numerals always where numbers stack vertically."
        useWhen={[
          'font-mono + tabular-nums: any monetary value or percentage',
          'font-sans (default): all labels, headings, copy, navigation',
        ]}
        avoidWhen={[
          'Using Inter for monetary figures — mono font is load-bearing for visual scanning',
          'Skipping tabular-nums on stacked number columns',
        ]}
      >
        <div className="space-y-4">
          {waterfallTypeSamples.map(({ label, className, text, context }) => (
            <div key={label} className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-0">
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
            Heading elements use tighter treatment: letter-spacing: −0.025em, line-height: 1.15. Defined in{' '}
            <code className="bg-card px-1 rounded">design-tokens.ts</code> — apply via{' '}
            <code className="bg-card px-1 rounded">tracking-heading</code> and{' '}
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
