const navCategories = [
  {
    category: "Principles",
    items: [
      { label: "Vision", anchor: "design-vision" },
      { label: "Core principles", anchor: "design-principles" },
      { label: "Invariants", anchor: "design-invariants" },
      { label: "Language rules", anchor: "design-language" },
    ],
  },
  {
    category: "Foundation",
    items: [
      { label: "Tier palette", anchor: "renew-tier-colors" },
      { label: "Status palette", anchor: "renew-status-colors" },
      { label: "Action palette", anchor: "renew-action-colors" },
      { label: "Attention", anchor: "renew-attention" },
      { label: "Callout gradients", anchor: "renew-callout-gradients" },
      { label: "Surface tokens", anchor: "renew-surface-colors" },
      { label: "Typography", anchor: "renew-typography" },
      { label: "Spacing", anchor: "renew-spacing" },
    ],
  },
  {
    category: "Waterfall",
    items: [
      { label: "WaterfallTierRow", anchor: "waterfall-tier-row" },
      { label: "WaterfallConnector", anchor: "waterfall-connector" },
      { label: "StalenessIndicator", anchor: "staleness-indicator" },
      { label: "ButtonPair", anchor: "button-pair" },
      { label: "NudgeCard", anchor: "nudge-card" },
      { label: "TimelineNavigator", anchor: "timeline-navigator" },
    ],
  },
  {
    category: "Components",
    items: [
      { label: "EntityAvatar", anchor: "entity-avatar" },
      { label: "Card", anchor: "card-component" },
      { label: "SnapshotBanner", anchor: "snapshot-banner" },
      { label: "SkeletonLoader", anchor: "skeleton-loader" },
      { label: "StaleDataBanner", anchor: "stale-data-banner" },
    ],
  },
  {
    category: "Forms",
    items: [
      { label: "Input states", anchor: "input-states" },
      { label: "Progressive disclosure", anchor: "progressive-disclosure" },
      { label: "Inline edit transform", anchor: "inline-edit-transform" },
    ],
  },
  {
    category: "Feedback",
    items: [
      { label: "Toast notifications", anchor: "toast-notifications" },
      { label: "Action feedback", anchor: "action-feedback" },
    ],
  },
  {
    category: "Data Display",
    items: [
      { label: "History sparkline", anchor: "history-sparkline" },
      { label: "ISA allowance bar", anchor: "isa-allowance-bar" },
      { label: "Empty states", anchor: "empty-states" },
    ],
  },
];

export function DesignRenewSidebar() {
  return (
    <div className="py-8 px-4">
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Dev Only
        </p>
        <h2 className="text-base font-semibold text-foreground">Renew Design System</h2>
        <div className="flex flex-col gap-1 mt-1">
          <a
            href="/design"
            className="text-xs text-muted-foreground hover:text-foreground inline-block"
          >
            ← Legacy design page
          </a>
          <a
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground inline-block"
          >
            ← Back to app
          </a>
        </div>
      </div>
      <nav className="space-y-6">
        {navCategories.map(({ category, items }) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {category}
            </p>
            <ul className="space-y-1">
              {items.map(({ label, anchor }) => (
                <li key={anchor}>
                  <a
                    href={`#${anchor}`}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
