import { useDismissRollover } from "@/hooks/useGifts";

type Props = { year: number; pending: boolean };

export function YearRolloverBanner({ year, pending }: Props) {
  const dismiss = useDismissRollover();
  if (!pending) return null;
  return (
    <div className="mx-6 mt-4 flex items-center justify-between rounded border border-foreground/10 bg-foreground/[0.03] px-4 py-2 text-xs text-foreground/65">
      <span>
        Gift plan for {year} has been created — you may want to review and update the planned
        amounts.
      </span>
      <button
        type="button"
        onClick={() => dismiss.mutate(year)}
        className="ml-3 rounded px-2 py-0.5 text-foreground/50 hover:text-foreground"
      >
        Dismiss
      </button>
    </div>
  );
}
