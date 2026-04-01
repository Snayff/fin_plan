// Renew component patterns — EntityAvatar, Card, SnapshotBanner, SkeletonLoader, StaleDataBanner
import { PatternSection } from "./PatternSection";
import { PatternExample } from "./PatternExample";

// Simple deterministic colour for EntityAvatar fallback
function avatarColor(name: string): string {
  const colors = [
    "hsl(var(--tier-income))",
    "hsl(var(--tier-committed))",
    "hsl(var(--tier-discretionary))",
    "hsl(var(--brand))",
    "hsl(var(--primary))",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? colors[0]!;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function DemoEntityAvatar({
  name,
  size = "md",
  hasImage = false,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  hasImage?: boolean;
}) {
  const sizeClasses = { sm: "w-6 h-6 text-xs", md: "w-8 h-8 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-heading font-bold text-white shrink-0`}
      style={{ backgroundColor: hasImage ? "#555" : avatarColor(name) }}
      title={name}
    >
      {hasImage ? <span className="text-xs opacity-60">img</span> : initials(name)}
    </div>
  );
}

function DemoCard({ children, stale = false }: { children: React.ReactNode; stale?: boolean }) {
  return (
    <div
      className={`rounded-md border bg-card p-6 ${stale ? "border-attention/40" : "border-border"}`}
    >
      {children}
    </div>
  );
}

function DemoSkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded bg-border/60 animate-pulse ${className}`}
      style={{ animationDuration: "1.5s" }}
    />
  );
}

export function ComponentRenewPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Components</h2>
        <p className="text-sm text-text-secondary">
          Shared UI components used across the renew app.
        </p>
      </div>

      <PatternSection
        id="entity-avatar"
        title="EntityAvatar"
        description="Displays an identity image for a named entity. Right panel only — not in the left panel or item list rows. Initials fallback uses a deterministic colour derived from the entity name."
        useWhen={[
          "Right panel detail view headline (lg size)",
          "Account rows in Wealth right panel (md size)",
        ]}
        avoidWhen={[
          "Left panel — waterfall left panel is text-only",
          "ItemRow in right panel item list — those are text-only too",
        ]}
      >
        <div className="space-y-6">
          <PatternExample label="Initials fallback — deterministic colour from name">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <DemoEntityAvatar name="Josh Salary" size="lg" />
                <span className="text-xs text-text-tertiary">lg (48px)</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DemoEntityAvatar name="Tandem ISA" size="md" />
                <span className="text-xs text-text-tertiary">md (32px)</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DemoEntityAvatar name="British Gas" size="sm" />
                <span className="text-xs text-text-tertiary">sm (24px)</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DemoEntityAvatar name="Trading 212" size="md" />
                <span className="text-xs text-text-tertiary">Trading 212</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DemoEntityAvatar name="Vanguard" size="md" />
                <span className="text-xs text-text-tertiary">Vanguard</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DemoEntityAvatar name="Octopus Energy" size="md" />
                <span className="text-xs text-text-tertiary">Octopus</span>
              </div>
            </div>
          </PatternExample>

          <PatternExample label="Right panel detail view context — avatar + headline + metadata">
            <div className="flex items-start gap-3">
              <DemoEntityAvatar name="Tandem ISA" size="lg" />
              <div>
                <p className="text-sm font-medium text-foreground">Tandem ISA</p>
                <p className="text-3xl font-semibold font-mono text-tier-income tabular-nums">
                  £17,300
                </p>
                <p className="text-xs text-text-tertiary">Last reviewed: Jan 2026</p>
              </div>
            </div>
          </PatternExample>
        </div>
      </PatternSection>

      <PatternSection
        id="card-component"
        title="Card"
        description="Used in the Review Wizard, Creation Wizard summary, and wherever a discrete item needs visual separation. Surface elevated + 1px border. No shadow — dark theme uses border contrast, not elevation shadows."
        useWhen={[
          "Review Wizard item cards",
          "Waterfall Creation Wizard summary items",
          "Any discrete item needing visual separation from the page background",
        ]}
        avoidWhen={[
          "Adding a shadow — shadow-md or shadow-lg are not used in the dark theme card pattern",
        ]}
      >
        <div className="grid grid-cols-2 gap-4">
          <PatternExample label="Default card — surface bg + border">
            <DemoCard>
              <p className="text-sm font-medium text-foreground">Josh Salary</p>
              <p className="text-2xl font-bold font-mono text-tier-income tabular-nums">
                £5,148 / mo
              </p>
              <p className="text-xs text-text-tertiary mt-1">Last reviewed: Jan 2026</p>
              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1.5 text-xs rounded border border-border text-foreground">
                  Update
                </button>
                <button className="px-3 py-1.5 text-xs rounded bg-primary text-white">
                  Still correct ✓
                </button>
              </div>
            </DemoCard>
          </PatternExample>
          <PatternExample label="Stale card — same bg, staleness amber applied to age indicator">
            <DemoCard stale>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-foreground">Cat Salary</p>
                <span className="text-xs text-attention font-mono">⚠ 14 months</span>
              </div>
              <p className="text-2xl font-bold font-mono text-tier-income tabular-nums">
                £3,708 / mo
              </p>
              <p className="text-xs text-attention mt-1">Last reviewed: Jan 2025</p>
              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1.5 text-xs rounded border border-border text-foreground">
                  Update
                </button>
                <button className="px-3 py-1.5 text-xs rounded bg-primary text-white">
                  Still correct ✓
                </button>
              </div>
            </DemoCard>
          </PatternExample>
        </div>
      </PatternSection>

      <PatternSection
        id="snapshot-banner"
        title="SnapshotBanner"
        description="Replaces the TimelineNavigator when a historical snapshot is loaded. Full-width, below the top nav. All edit controls are hidden while visible."
        useWhen={["Overview page, when a snapshot is being viewed in read-only mode"]}
        avoidWhen={[
          "Other pages",
          "When in live/current view — SnapshotBanner and TimelineNavigator are mutually exclusive",
        ]}
      >
        <PatternExample label="Read-only snapshot mode">
          <div className="rounded-md border border-border bg-card px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Viewing: <span className="text-foreground font-medium">January 2026 Review</span>
            </span>
            <button className="text-page-accent hover:underline text-xs">
              Return to current ▸
            </button>
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="skeleton-loader"
        title="SkeletonLoader"
        description="Displayed during initial data loading. Mirrors the layout it will replace. Shimmer animation at 1.5s cycle. Two variants: left panel (tier rows) and right panel (detail view)."
        useWhen={[
          "Left panel variant: initial page load, household switch",
          "Right panel variant: when tier selection data takes >150ms to load",
        ]}
        avoidWhen={[
          "Async button operations — those use the button loading state (spinner in button), not a skeleton",
          "First render if data loads in <150ms — skip the skeleton entirely",
        ]}
      >
        <div className="grid grid-cols-2 gap-6">
          <PatternExample label="Left panel variant — 4 tier-row blocks + connectors">
            <div className="space-y-2 w-48">
              <DemoSkeletonBlock className="h-8 w-full" />
              <DemoSkeletonBlock className="h-2 w-24 ml-4" />
              <DemoSkeletonBlock className="h-8 w-full" />
              <DemoSkeletonBlock className="h-2 w-24 ml-4" />
              <DemoSkeletonBlock className="h-8 w-full" />
              <DemoSkeletonBlock className="h-2 w-16 ml-4" />
              <DemoSkeletonBlock className="h-10 w-full" />
            </div>
          </PatternExample>
          <PatternExample label="Right panel variant — headline + chart + button pair">
            <div className="space-y-4 w-64">
              <DemoSkeletonBlock className="h-5 w-32" />
              <DemoSkeletonBlock className="h-10 w-48" />
              <DemoSkeletonBlock className="h-3 w-40" />
              <DemoSkeletonBlock className="h-20 w-full" />
              <div className="flex gap-2">
                <DemoSkeletonBlock className="h-9 w-20" />
                <DemoSkeletonBlock className="h-9 w-28" />
              </div>
            </div>
          </PatternExample>
        </div>
      </PatternSection>

      <PatternSection
        id="stale-data-banner"
        title="StaleDataBanner"
        description="Non-destructive error state when the app can't sync with the backend. Retains cached data. Uses attention amber — never destructive red. Auto-dismisses on successful resync."
        useWhen={["When an API sync fails and cached data is being shown"]}
        avoidWhen={[
          "Using destructive (red) — connectivity failure is informational, not an error",
          "Blanking out the UI — cached data should always be shown",
        ]}
      >
        <PatternExample label="Muted amber bar — informational, never blocking">
          <div className="rounded-md px-4 py-2 flex items-center justify-between text-sm bg-attention/10 border border-attention/30">
            <span className="text-text-secondary">
              Data may be outdated — last synced{" "}
              <span className="text-attention font-medium">3 minutes ago</span>
            </span>
            <button className="text-page-accent hover:underline text-xs">Retry</button>
          </div>
        </PatternExample>
      </PatternSection>
    </div>
  );
}
