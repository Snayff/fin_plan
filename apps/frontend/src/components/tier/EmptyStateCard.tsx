import { getEmptyStateCopy } from "./emptyStateCopy";
import type { TierKey } from "./tierConfig";

interface Props {
  subcategoryName: string;
  tier: TierKey;
  onAddItem: () => void;
}

export default function EmptyStateCard({ subcategoryName, tier, onAddItem }: Props) {
  const copy = getEmptyStateCopy(subcategoryName, tier);

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)",
          border: "1px solid rgba(139,92,246,0.18)",
        }}
      >
        <h3
          className="font-heading text-base font-extrabold"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {copy.header}
        </h3>
        <p className="mt-2 text-sm text-foreground/60">{copy.body}</p>
        <button
          onClick={onAddItem}
          className="mt-4 rounded-lg bg-page-accent/20 px-4 py-2 text-sm font-medium text-page-accent hover:bg-page-accent/30 transition-colors"
        >
          + Add item
        </button>
      </div>
    </div>
  );
}
