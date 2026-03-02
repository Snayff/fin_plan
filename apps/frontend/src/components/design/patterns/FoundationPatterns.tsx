// Update this file when design tokens or global styles are modified.
import { ColorSwatch } from '../ColorSwatch';
import { PatternSection } from '../PatternSection';

const semanticColors = [
  { name: 'Background', cssVar: '--background', tailwindClass: 'bg-background', hex: '#191D32', description: 'Main app background' },
  { name: 'Card / Surface', cssVar: '--card', tailwindClass: 'bg-card', hex: '#22263D', description: 'Card and panel backgrounds' },
  { name: 'Border', cssVar: '--border', tailwindClass: 'border-border', hex: '#2F3452', description: 'Dividers and input borders' },
  { name: 'Foreground', cssVar: '--foreground', tailwindClass: 'text-foreground', hex: '#F2F3F7', description: 'Primary text' },
  { name: 'Muted Foreground', cssVar: '--muted-foreground', tailwindClass: 'text-muted-foreground', hex: '#9DA1B8', description: 'Secondary / de-emphasised text' },
  { name: 'Primary (Orange)', cssVar: '--primary', tailwindClass: 'bg-primary', hex: '#FF7A18', description: 'Primary actions, CTAs, focus rings' },
  { name: 'Success (Teal)', cssVar: '--success', tailwindClass: 'bg-success', hex: '#07BEB8', description: 'Income, progress, positive states' },
  { name: 'Accent (Purple)', cssVar: '--accent', tailwindClass: 'bg-accent', hex: '#B38BA3', description: 'Branding, accent features' },
  { name: 'Warning (Magenta)', cssVar: '--warning', tailwindClass: 'bg-warning', hex: '#8F3985', description: 'Financial status badges: Overdue, Over budget, Behind — awareness, not error' },
  { name: 'Destructive (Red)', cssVar: '--destructive', tailwindClass: 'bg-destructive', hex: '#E5484D', description: 'Errors, data loss — use sparingly' },
  { name: 'Highlight (Magenta)', cssVar: '--highlight', tailwindClass: 'bg-highlight', hex: '#8F3985', description: 'Same colour as Warning. Use bg-highlight for decorative labels (e.g. Goal badges); bg-warning for status badges' },
  { name: 'Expense', cssVar: '--expense', tailwindClass: 'bg-expense', hex: '#4a5568', description: 'Expense data (discrete, harmonious)' },
];

const typeSamples = [
  { label: 'text-5xl / 48px', className: 'text-5xl font-bold', text: 'Heading 1' },
  { label: 'text-4xl / 36px', className: 'text-4xl font-bold', text: 'Heading 2' },
  { label: 'text-3xl / 30px', className: 'text-3xl font-semibold', text: 'Heading 3' },
  { label: 'text-2xl / 24px', className: 'text-2xl font-semibold', text: 'Heading 4' },
  { label: 'text-xl / 20px', className: 'text-xl font-medium', text: 'Heading 5' },
  { label: 'text-lg / 18px', className: 'text-lg font-medium', text: 'Large body / subheading' },
  { label: 'text-base / 16px', className: 'text-base', text: 'Body text — default. Mid-life users benefit from 16px base.' },
  { label: 'text-sm / 14px', className: 'text-sm text-muted-foreground', text: 'Secondary info, labels, captions' },
  { label: 'text-xs / 12px', className: 'text-xs text-muted-foreground', text: 'Fine print, badges, metadata' },
];

const spacingSamples = [
  { token: '1', px: '4px', tailwind: 'p-1 / gap-1 / m-1' },
  { token: '2', px: '8px', tailwind: 'p-2 / gap-2 / m-2' },
  { token: '3', px: '12px', tailwind: 'p-3 / gap-3 / m-3' },
  { token: '4', px: '16px', tailwind: 'p-4 / gap-4 / m-4' },
  { token: '6', px: '24px', tailwind: 'p-6 / gap-6 / m-6 — card default padding' },
  { token: '8', px: '32px', tailwind: 'p-8 / gap-8 / m-8' },
  { token: '12', px: '48px', tailwind: 'p-12 / gap-12 / m-12' },
];

export function FoundationPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Foundation</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Core tokens — colour, type, and spacing. All values flow from{' '}
          <code className="text-xs bg-background border border-border px-1 rounded">
            src/config/design-tokens.ts
          </code>{' '}
          and are exposed as CSS variables in{' '}
          <code className="text-xs bg-background border border-border px-1 rounded">index.css</code>.
        </p>
      </div>

      <PatternSection
        id="colors"
        title="Colors"
        description="All colours are purpose-driven (semantic), not hue-based. Use the Tailwind class — never hardcode hex values."
        useWhen={['Communicating status or feedback (success, warning, error)', 'Matching existing page patterns']}
        avoidWhen={['Hardcoding hex values in className', 'Using destructive for anything less than true errors or data loss']}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {semanticColors.map((color) => (
            <ColorSwatch key={color.cssVar} {...color} />
          ))}
        </div>
        <div className="mt-6 p-4 rounded-lg bg-background border border-border text-sm space-y-2">
          <p className="font-medium text-foreground">Subtle variants</p>
          <p className="text-muted-foreground text-xs">
            Every semantic colour has a subtle background variant for non-intrusive emphasis:{' '}
            <code className="bg-card px-1 rounded">bg-destructive-subtle</code>,{' '}
            <code className="bg-card px-1 rounded">bg-success-subtle</code>,{' '}
            <code className="bg-card px-1 rounded">bg-warning-subtle</code>,{' '}
            <code className="bg-card px-1 rounded">bg-highlight-subtle</code>.
            Use these for bordered info/alert blocks instead of full colour fills.
          </p>
        </div>
        <div className="mt-3 p-4 rounded-lg bg-background border border-border text-sm space-y-2">
          <p className="font-medium text-foreground">Warm orange (attention)</p>
          <p className="text-muted-foreground text-xs">
            The warm orange primitive (<code className="bg-card px-1 rounded">#E0B084</code>) is available as{' '}
            <code className="bg-card px-1 rounded">hsl(var(--chart-5))</code> only — there is no{' '}
            <code className="bg-card px-1 rounded">bg-attention</code> class. For financial status badges, use{' '}
            <code className="bg-card px-1 rounded">bg-warning</code> (magenta).
          </p>
        </div>
      </PatternSection>

      <PatternSection
        id="typography"
        title="Typography"
        description="Inter at 16px base. Larger than typical (14px) to support our mid-life user base. Heading hierarchy is auto-applied in index.css — use semantic HTML tags where possible."
      >
        <div className="space-y-4">
          {typeSamples.map(({ label, className, text }) => (
            <div key={label} className="flex items-baseline gap-4 border-b border-border pb-3 last:border-0">
              <span className="text-xs text-muted-foreground w-36 shrink-0 font-mono">{label}</span>
              <span className={className}>{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-lg bg-background border border-border text-sm">
          <p className="font-medium text-foreground mb-1">Mono font</p>
          <p className="text-muted-foreground text-xs mb-2">
            JetBrains Mono is available for numerical data where alignment matters (e.g. financial figures).
          </p>
          <p className="font-mono text-base text-foreground">£12,450.00 · –£3,200.00 · +£8,900.50</p>
          <p className="text-muted-foreground text-xs mt-2">
            Use the Unicode en-dash (–, U+2013) for negative values — never a hyphen (-).
          </p>
        </div>
      </PatternSection>

      <PatternSection
        id="spacing"
        title="Spacing"
        description="8px base grid. Use Tailwind spacing tokens — avoid arbitrary values. Card default padding is p-6 (24px). Page wrapper uses p-6."
      >
        <div className="space-y-3">
          {spacingSamples.map(({ token, px, tailwind }) => (
            <div key={token} className="flex items-center gap-4">
              <div
                className="bg-primary/30 border border-primary rounded shrink-0"
                style={{ width: px, height: px, minWidth: px }}
              />
              <div className="flex gap-3 items-baseline">
                <span className="text-xs font-mono text-muted-foreground w-10">{px}</span>
                <span className="text-xs text-muted-foreground">{tailwind}</span>
              </div>
            </div>
          ))}
        </div>
      </PatternSection>
    </div>
  );
}
