import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";

interface CashflowStaleBannerProps {
  oldestMonths: number;
  youngestMonths: number;
  onRefresh: () => void;
}

export function CashflowStaleBanner({
  oldestMonths,
  youngestMonths,
  onRefresh,
}: CashflowStaleBannerProps) {
  return (
    <div
      role="status"
      className="w-full px-4 py-1.5 text-xs flex items-center gap-2 bg-attention/4 border-b border-attention/8 text-attention"
    >
      <span>
        Linked balances {youngestMonths}–{oldestMonths} months old ·{" "}
        <GlossaryTermMarker entryId="projection">projection</GlossaryTermMarker> may drift ·{" "}
        <button
          type="button"
          onClick={onRefresh}
          className="underline underline-offset-2 hover:no-underline"
        >
          Refresh accounts
        </button>
      </span>
    </div>
  );
}
