import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface StaleDataBannerProps {
  lastSyncedAt: Date | null;
  onRetry: () => void;
}

export function StaleDataBanner({ lastSyncedAt, onRetry }: StaleDataBannerProps) {
  const [, forceRender] = useState(0);

  // Refresh "N minutes ago" text every 30s
  useEffect(() => {
    const interval = setInterval(() => forceRender((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = lastSyncedAt
    ? `last synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`
    : "last sync time unknown";

  return (
    <div
      className="w-full px-4 py-1.5 text-xs flex items-center gap-2"
      style={{
        background: "rgba(245, 158, 11, 0.04)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.08)",
        color: "#f59e0b",
      }}
    >
      <span>Data may be outdated — {timeAgo}</span>
      <button
        onClick={onRetry}
        className="underline underline-offset-2 hover:no-underline"
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
