// Renew feedback patterns — toasts, button loading, action feedback
import { PatternSection } from "./PatternSection";
import { PatternExample } from "./PatternExample";

function DemoToast({
  variant,
  message,
}: {
  variant: "success" | "error" | "info";
  message: string;
}) {
  const variantClass = {
    success: "border-success/40 bg-success/10",
    error: "border-destructive/40 bg-destructive/10",
    info: "border-border bg-card",
  }[variant];

  const iconColor = {
    success: "text-success",
    error: "text-destructive",
    info: "text-text-secondary",
  }[variant];

  const icon = { success: "✓", error: "✕", info: "ℹ" }[variant];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm w-72 ${variantClass}`}
    >
      <span className={`font-bold ${iconColor} mt-0.5`}>{icon}</span>
      <p className="text-foreground flex-1">{message}</p>
      <button className="text-text-tertiary hover:text-foreground text-xs">✕</button>
    </div>
  );
}

export function FeedbackRenewPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Feedback</h2>
        <p className="text-sm text-text-secondary">
          How the app communicates the outcome of user actions.
        </p>
      </div>

      <PatternSection
        id="toast-notifications"
        title="Toast notifications"
        description="Non-blocking, bottom-right anchored, auto-dismiss after 4s, dismissable manually. Success uses success (green), error uses destructive (red), info is neutral."
        useWhen={[
          "success: async operation completed (save, sync, resync)",
          "error: operation failed (save failed, sync failed)",
          "info: neutral status update",
        ]}
        avoidWhen={[
          "Using toasts for synchronous feedback — use micro-interactions instead",
          "Stacking more than 2 toasts simultaneously",
        ]}
      >
        <div className="space-y-3">
          <PatternExample label="Success — async operation completed">
            <DemoToast variant="success" message="Changes saved" />
          </PatternExample>
          <PatternExample label="Success — data refreshed after StaleDataBanner retry">
            <DemoToast variant="success" message="Data refreshed" />
          </PatternExample>
          <PatternExample label="Error — sync failure (retains cached data — see StaleDataBanner)">
            <DemoToast variant="error" message="Couldn't connect — using last synced data" />
          </PatternExample>
          <PatternExample label="Info — neutral status">
            <DemoToast variant="info" message="Snapshot saved as 'March 2026 Review'" />
          </PatternExample>
        </div>
      </PatternSection>

      <PatternSection
        id="action-feedback"
        title="Action feedback"
        description="Every user action that changes state produces visible feedback. Instant actions use micro-interactions on the element itself. Async operations use button loading states."
        useWhen={[
          'copy: icon transforms to "Copied!" chip for 2s',
          '"Still correct ✓": brief state change on the button (visual confirmation)',
          "Async save: loading spinner in button → success/error toast",
          "Destructive action: modal confirmation before proceeding",
        ]}
        avoidWhen={[
          "Silent state changes — always show feedback",
          "Using a modal for non-destructive feedback",
        ]}
      >
        <div className="grid grid-cols-2 gap-4">
          <PatternExample label='"Still correct ✓" — brief visual confirmation'>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded border border-border text-foreground">
                Edit
              </button>
              <button
                className="px-3 py-1.5 text-xs rounded text-white font-medium"
                style={{ backgroundColor: "hsl(var(--success))" }}
              >
                ✓ Confirmed
              </button>
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Brief state change on the button provides immediate visual confirmation, then returns
              to action violet
            </p>
          </PatternExample>
          <PatternExample label="Button loading state — spinner replaces label">
            <button className="px-4 py-2 text-sm rounded-md bg-primary text-white flex items-center gap-2 opacity-80">
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving...
            </button>
          </PatternExample>
          <PatternExample label="Copy — icon → 'Copied!' chip for 2s">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">
                  https://app/invite/abc123
                </span>
                <button className="px-2 py-0.5 rounded bg-success/10 text-success text-xs border border-success/30">
                  Copied!
                </button>
              </div>
            </div>
          </PatternExample>
          <PatternExample label="Destructive confirmation — modal before proceeding">
            <div className="rounded-md border border-border bg-card p-4 space-y-3 text-sm max-w-xs">
              <p className="font-medium text-foreground">Remove member?</p>
              <p className="text-text-secondary text-xs">
                This will revoke their access immediately.
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs rounded border border-border text-foreground">
                  Cancel
                </button>
                <button className="px-3 py-1.5 text-xs rounded bg-destructive text-white">
                  Remove
                </button>
              </div>
            </div>
          </PatternExample>
        </div>
      </PatternSection>
    </div>
  );
}
