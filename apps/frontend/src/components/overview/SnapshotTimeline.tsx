import { useRef, useState } from "react";
import { format } from "date-fns";
import { useSnapshots } from "@/hooks/useSettings";

interface SnapshotTimelineProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSelectNow: () => void;
  onOpenCreate: () => void;
  onOpenReview?: () => void;
}

export function SnapshotTimeline({
  selectedId,
  onSelect,
  onSelectNow,
  onOpenCreate,
  onOpenReview,
}: SnapshotTimelineProps) {
  const { data: snapshots = [] } = useSnapshots();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  const sorted = [...(snapshots as any[])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="h-8 border-b flex items-center gap-2 px-3 text-xs">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => scrollBy(-120)}
        >
          ◂
        </button>
      )}

      {/* Scrollable dot row */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3"
        onScroll={checkScroll}
      >
        {sorted.map((snap) => (
          <button
            key={snap.id as string}
            type="button"
            title={`${snap.name as string} — ${format(new Date(snap.createdAt as string), "dd MMM yyyy")}`}
            onClick={() => onSelect(snap.id as string)}
            className="shrink-0 flex flex-col items-center gap-0.5 group"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full transition-colors ${
                selectedId === snap.id
                  ? "bg-primary"
                  : "bg-muted-foreground/40 group-hover:bg-muted-foreground"
              }`}
            />
            <span className="max-w-[60px] truncate text-muted-foreground group-hover:text-foreground leading-none">
              {snap.name as string}
            </span>
          </button>
        ))}

        {/* Now */}
        <button
          type="button"
          onClick={onSelectNow}
          className="shrink-0 flex flex-col items-center gap-0.5 group"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full transition-colors ${
              selectedId === null
                ? "bg-primary"
                : "bg-muted-foreground/40 group-hover:bg-muted-foreground"
            }`}
          />
          <span className="text-muted-foreground group-hover:text-foreground leading-none">
            Now
          </span>
        </button>
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => scrollBy(120)}
        >
          ▸
        </button>
      )}

      {/* Review button */}
      {onOpenReview && (
        <button
          type="button"
          onClick={onOpenReview}
          className="shrink-0 text-primary hover:underline whitespace-nowrap"
        >
          Review ▸
        </button>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={onOpenCreate}
        className="shrink-0 text-primary hover:underline whitespace-nowrap"
      >
        + Save snapshot
      </button>
    </div>
  );
}
