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
      className="w-full px-4 py-1.5 text-xs flex items-center gap-2 bg-attention/4 border-b border-attention/8 text-attention"
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
