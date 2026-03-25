interface SnapshotMeta {
  id: string;
  name: string;
}

interface OverviewPageHeaderProps {
  activeSnapshot: SnapshotMeta | null;
  onExitSnapshot: () => void;
}

export function OverviewPageHeader({ activeSnapshot, onExitSnapshot }: OverviewPageHeaderProps) {
  if (!activeSnapshot) {
    return (
      <div className="h-8 border-b flex items-center px-4">
        <span className="text-sm font-heading font-semibold text-foreground">Overview</span>
      </div>
    );
  }

  return (
    <div className="h-8 border-b flex items-center px-4 gap-1.5 text-sm">
      <span className="text-muted-foreground font-heading">Overview</span>
      <span className="text-muted-foreground/50" aria-hidden="true">
        ›
      </span>
      <span
        title={activeSnapshot.name}
        className="font-heading font-medium text-foreground max-w-[40ch] overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {activeSnapshot.name}
      </span>
      <span className="text-muted-foreground/50 mx-0.5" aria-hidden="true">
        ·
      </span>
      <span
        className="text-[11px] font-medium px-1.5 py-0.5 rounded"
        style={{
          color: "var(--color-attention)",
          background: "color-mix(in srgb, var(--color-attention) 10%, transparent)",
        }}
      >
        Read only
      </span>
      <button
        type="button"
        onClick={onExitSnapshot}
        className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Live view
      </button>
    </div>
  );
}
