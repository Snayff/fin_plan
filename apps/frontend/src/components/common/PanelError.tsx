import { useId } from "react";

interface PanelErrorProps {
  onRetry: () => void;
  variant: "left" | "right" | "detail";
  message?: string;
}

function GhostBlock({ className }: { className?: string }) {
  return (
    <div className={`rounded ${className ?? ""}`} style={{ background: "#2a3f60", opacity: 0.3 }} />
  );
}

function GhostSkeleton({ variant }: { variant: "left" | "right" | "detail" }) {
  if (variant === "left") {
    return (
      <div className="space-y-3 p-4 w-full">
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-1 w-3/4 mt-2" />
        <GhostBlock className="h-1 w-1/2" />
      </div>
    );
  }
  if (variant === "right") {
    return (
      <div className="space-y-4 p-6 w-full">
        <GhostBlock className="h-12 w-2/3" />
        <GhostBlock className="h-40 w-full" />
        <div className="flex gap-2">
          <GhostBlock className="h-8 w-24" />
          <GhostBlock className="h-8 w-24" />
        </div>
      </div>
    );
  }
  // detail
  return (
    <div className="space-y-4 p-6 w-full">
      <GhostBlock className="h-8 w-1/2" />
      <GhostBlock className="h-28 w-full" />
      <GhostBlock className="h-4 w-3/4" />
      <GhostBlock className="h-4 w-1/2" />
      <GhostBlock className="h-4 w-2/3" />
    </div>
  );
}

export function PanelError({ onRetry, variant, message }: PanelErrorProps) {
  const id = useId();
  const messageId = `${id}-msg`;

  return (
    <div className="relative w-full h-full min-h-[200px]">
      <GhostSkeleton variant={variant} />
      <div
        role="alert"
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{ background: "rgba(8,10,20,0.70)", backdropFilter: "blur(2px)" }}
      >
        <p className="text-sm font-medium text-destructive">Failed to load</p>
        {message && (
          <p id={messageId} className="text-xs text-muted-foreground text-center max-w-[180px]">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={onRetry}
          aria-describedby={message ? messageId : undefined}
          className="text-xs px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
          style={{
            background: "hsl(0,40%,15%)",
            border: "1px solid hsl(0,60%,25%)",
            color: "hsl(var(--destructive))",
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
