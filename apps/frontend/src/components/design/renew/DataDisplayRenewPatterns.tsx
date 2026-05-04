// Renew data display patterns — sparklines, ISA progress bar, empty states
import { PatternSection } from "./PatternSection";
import { PatternExample } from "./PatternExample";

// Minimal sparkline rendered as an SVG path for demo purposes
function DemoSparkline({
  data,
  snapshotIndex,
  color = "hsl(var(--tier-income))",
}: {
  data: number[];
  snapshotIndex?: number;
  color?: string;
}) {
  const width = 240;
  const height = 56;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${points.join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {snapshotIndex !== undefined && (
        <line
          x1={pad + (snapshotIndex / (data.length - 1)) * (width - pad * 2)}
          y1={0}
          x2={pad + (snapshotIndex / (data.length - 1)) * (width - pad * 2)}
          y2={height}
          stroke="hsl(var(--text-tertiary))"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
      )}
    </svg>
  );
}

function DemoIsaBar({ used, total }: { used: number; total: number }) {
  const pct = Math.round((used / total) * 100);
  const remaining = total - used;
  return (
    <div className="space-y-1.5 w-64">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>ISA allowance used</span>
        <span className="text-text-tertiary">Apr deadline</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: "hsl(var(--tier-income))" }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="font-mono text-tier-income tabular-nums">£{used.toLocaleString()}</span>
        <span className="text-text-tertiary font-mono tabular-nums">
          £{remaining.toLocaleString()} remaining
        </span>
      </div>
    </div>
  );
}

const salaryHistory = [
  4500, 4500, 4800, 4800, 4800, 5000, 5000, 5148, 5148, 5148, 5148, 5148, 5148, 5148, 5148, 5148,
  5148, 5148, 5148, 5148, 5148, 5148, 5148, 5148,
];
const savingsHistory = [
  10000, 10700, 11400, 12100, 12800, 13500, 14200, 14900, 15600, 16300, 17000, 17300, 17300, 17300,
  17300, 17300, 17300, 17300, 17300, 17300, 17300, 17300, 17300, 17300,
];

export function DataDisplayRenewPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Data Display</h2>
        <p className="text-sm text-text-secondary">
          How financial data is presented visually across the app.
        </p>
      </div>

      <PatternSection
        id="history-sparkline"
        title="History sparkline"
        description="24-month rolling window of a value's history, displayed in right panel detail view (State 3) and Wealth account detail. When viewing a snapshot, a dashed vertical marker indicates the snapshot date."
        useWhen={[
          "Right panel detail view — below the headline value",
          "Wealth account detail — showing balance history",
        ]}
        avoidWhen={[
          "More than 2–3 micro charts in a single view simultaneously",
          "Tables where a sparkline would communicate the trend better",
        ]}
      >
        <div className="grid grid-cols-2 gap-6">
          <PatternExample label="Salary — step chart, showing increases over 24 months">
            <div className="space-y-1">
              <p className="text-3xl font-semibold font-mono text-tier-income tabular-nums">
                £5,148
              </p>
              <p className="text-xs text-text-tertiary">per month · Last reviewed: Jan 2026</p>
              <DemoSparkline data={salaryHistory} color="hsl(var(--tier-income))" />
              <div className="flex justify-between text-xs text-text-tertiary font-mono">
                <span>Mar 2024</span>
                <span>Mar 2026</span>
              </div>
            </div>
          </PatternExample>
          <PatternExample label="Savings balance — with snapshot marker (dashed line)">
            <div className="space-y-1">
              <p className="text-3xl font-semibold font-mono text-tier-income tabular-nums">
                £17,300
              </p>
              <p className="text-xs text-attention">⚠ Last reviewed: 14 months ago</p>
              <DemoSparkline
                data={savingsHistory}
                color="hsl(var(--tier-income))"
                snapshotIndex={11}
              />
              <div className="flex justify-between text-xs text-text-tertiary font-mono">
                <span>Mar 2024</span>
                <span className="text-text-tertiary">↑ Jan 2026 snapshot</span>
              </div>
            </div>
          </PatternExample>
        </div>
      </PatternSection>

      <PatternSection
        id="isa-allowance-bar"
        title="ISA allowance progress bar"
        description="Tracks combined ISA contributions for a person against the annual £20,000 limit. Shown in the Wealth page Savings class. Per-person where multiple household members hold ISA accounts."
        useWhen={["Wealth page — Savings class right panel, when any ISA accounts exist"]}
        avoidWhen={["Tracking at per-account level — the allowance is a person-level limit"]}
      >
        <div className="space-y-4">
          <PatternExample label="Josh — £8,400 of £20,000 used">
            <div className="space-y-2">
              <p className="text-xs text-text-tertiary">Josh</p>
              <DemoIsaBar used={8400} total={20000} />
            </div>
          </PatternExample>
          <PatternExample label="Cat — £3,200 of £20,000 used (two ISA accounts, summed)">
            <div className="space-y-2">
              <p className="text-xs text-text-tertiary">Cat</p>
              <DemoIsaBar used={3200} total={20000} />
            </div>
          </PatternExample>
        </div>
      </PatternSection>

      <PatternSection
        id="empty-states"
        title="Empty states"
        description="Every empty state includes a clear call to action. A blank view is never acceptable. Silence = approval only when data exists — when data is absent, the app guides the user forward."
        useWhen={[
          "Overview — no waterfall data: CTA to Waterfall Creation Wizard",
          "Right panel — nothing selected: muted placeholder",
          'Any tier/list with no items: inline "Add first item" action',
        ]}
        avoidWhen={[
          "Blank panels with no copy or CTA",
          'Using silence as an empty state — silence is reserved for "everything is fine"',
        ]}
      >
        <div className="space-y-4">
          <PatternExample label="Overview — no waterfall data yet">
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <p className="text-text-secondary text-sm">Your waterfall is empty.</p>
              <button className="px-4 py-2 text-sm rounded-md bg-primary text-white">
                Build your waterfall
              </button>
            </div>
          </PatternExample>
          <PatternExample label="Right panel — nothing selected">
            <div className="flex items-center justify-center py-8 text-text-tertiary text-sm">
              Select any item to see its detail
            </div>
          </PatternExample>
          <PatternExample label="Tier with no items — inline add action">
            <div className="space-y-2 text-sm">
              <p className="text-xs text-text-tertiary">← Income</p>
              <p className="text-text-tertiary text-sm">No income sources yet.</p>
              <button className="text-page-accent hover:underline text-sm text-left">
                + Add first income source
              </button>
            </div>
          </PatternExample>
        </div>
      </PatternSection>
    </div>
  );
}
