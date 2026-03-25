import { useRef, useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useSnapshots } from "@/hooks/useSettings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SnapshotDot } from "./SnapshotDot";

// ─── Position algorithm constants (from spec) ────────────────────────────────
const PAD_LEFT = 20;
const PAD_RIGHT = 60;
const PX_PER_DAY = 1.1;
const MIN_GAP_PX = 16;
const MAX_GAP_PX = 130;

interface SnapshotMeta {
  id: string;
  name: string;
  isAuto: boolean;
  createdAt: string;
}

interface SnapshotTimelineProps {
  selectedId: string | null;
  loadingId: string | null;
  isViewingSnapshot: boolean;
  onSelect: (id: string) => void;
  onSelectNow: () => void;
  onOpenCreate: () => void;
  onOpenReview?: () => void;
}

function buildPositions(snapshots: SnapshotMeta[]): number[] {
  if (snapshots.length === 0) return [];
  const positions = [PAD_LEFT];
  for (let i = 1; i < snapshots.length; i++) {
    const days =
      (new Date(snapshots[i]!.createdAt).getTime() -
        new Date(snapshots[i - 1]!.createdAt).getTime()) /
      86400000;
    const gap = Math.max(MIN_GAP_PX, Math.min(days * PX_PER_DAY, MAX_GAP_PX));
    positions.push(positions[i - 1]! + gap);
  }
  return positions;
}

function interpolateX(
  targetMs: number,
  leftMs: number,
  rightMs: number,
  leftX: number,
  rightX: number
): number {
  if (rightMs === leftMs) return leftX;
  return leftX + ((targetMs - leftMs) / (rightMs - leftMs)) * (rightX - leftX);
}

function buildYearMarkers(
  snapshots: SnapshotMeta[],
  positions: number[]
): Array<{ year: number; x: number }> {
  if (snapshots.length < 2) return [];
  const first = new Date(snapshots[0]!.createdAt);
  const last = new Date(snapshots[snapshots.length - 1]!.createdAt);
  const markers: Array<{ year: number; x: number }> = [];

  for (let year = first.getFullYear() + 1; year <= last.getFullYear(); year++) {
    const jan1Ms = new Date(year, 0, 1).getTime();
    let leftIdx = 0;
    for (let i = 0; i < snapshots.length - 1; i++) {
      if (
        new Date(snapshots[i]!.createdAt).getTime() <= jan1Ms &&
        new Date(snapshots[i + 1]!.createdAt).getTime() >= jan1Ms
      ) {
        leftIdx = i;
        break;
      }
    }
    const x = interpolateX(
      jan1Ms,
      new Date(snapshots[leftIdx]!.createdAt).getTime(),
      new Date(snapshots[leftIdx + 1]!.createdAt).getTime(),
      positions[leftIdx]!,
      positions[leftIdx + 1]!
    );
    markers.push({ year, x });
  }
  return markers;
}

export function SnapshotTimeline({
  selectedId,
  loadingId,
  isViewingSnapshot,
  onSelect,
  onSelectNow,
  onOpenCreate,
  onOpenReview,
}: SnapshotTimelineProps) {
  const { data: snapshots, isLoading, isError, refetch } = useSnapshots();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isAtRightEdge, setIsAtRightEdge] = useState(false);

  const sorted = [...((snapshots ?? []) as SnapshotMeta[])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const positions = buildPositions(sorted);
  const totalWidth = positions.length > 0 ? positions[positions.length - 1]! + PAD_RIGHT : 200;
  const yearMarkers = buildYearMarkers(sorted, positions);

  let dateRangeLabel = "";
  if (sorted.length === 1) {
    dateRangeLabel = format(new Date(sorted[0]!.createdAt), "MM/yy");
  } else if (sorted.length >= 2) {
    dateRangeLabel =
      format(new Date(sorted[0]!.createdAt), "MM/yy") +
      " – " +
      format(new Date(sorted[sorted.length - 1]!.createdAt), "MM/yy");
  }

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    setIsAtRightEdge(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [sorted.length, checkScroll]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (scrollRef.current) scrollRef.current.scrollLeft -= e.deltaY * 0.8;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    dragRef.current = { startX: e.clientX, startScrollLeft: scrollRef.current.scrollLeft };
    scrollRef.current.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft =
      dragRef.current.startScrollLeft + (dragRef.current.startX - e.clientX);
  }, []);

  const clearDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  function handleNowClick() {
    scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    onSelectNow();
  }

  return (
    <div className="border-b text-xs select-none">
      {/* Meta row */}
      <div className="h-7 flex items-center justify-between px-3">
        <span className="text-muted-foreground/60 font-numeric tabular-nums">{dateRangeLabel}</span>
        {!isViewingSnapshot && (
          <div className="flex items-center gap-2">
            {onOpenReview && (
              <button
                type="button"
                onClick={onOpenReview}
                className="text-primary hover:underline whitespace-nowrap"
              >
                Review ▸
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreate}
              className="text-primary hover:underline whitespace-nowrap"
            >
              + Save snapshot
            </button>
          </div>
        )}
      </div>

      {/* Bar row */}
      <div className="h-8 flex items-center gap-1 px-2">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-200)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll timeline left"
          >
            ◂
          </button>
        )}

        {/* Scrollable track */}
        <div className="relative flex-1 h-full overflow-hidden">
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent z-10" />
          )}

          <div
            ref={scrollRef}
            className="relative h-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
            onScroll={checkScroll}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={clearDrag}
            onPointerLeave={clearDrag}
          >
            {isLoading ? (
              <div className="flex items-center h-full gap-3 px-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="shrink-0 h-1.5 w-8 rounded animate-pulse bg-muted" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex items-center h-full px-3 text-destructive gap-1.5">
                Failed to load
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex items-center h-full px-3 text-muted-foreground/60 italic">
                No snapshots yet
              </div>
            ) : (
              <TooltipProvider>
                <div
                  className="relative h-full"
                  style={{ width: `${totalWidth}px`, minWidth: "100%" }}
                >
                  {yearMarkers.map(({ year, x }) => (
                    <div
                      key={year}
                      className="absolute top-0 h-full pointer-events-none"
                      style={{ left: `${x}px`, transform: "translateX(-50%)" }}
                    >
                      <div className="w-px h-full bg-border/40" />
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 font-numeric whitespace-nowrap">
                        {year}
                      </span>
                    </div>
                  ))}

                  {sorted.map((snap, i) => (
                    <div
                      key={snap.id}
                      className="absolute top-1/2"
                      style={{ left: `${positions[i]}px` }}
                    >
                      <SnapshotDot
                        snapshot={snap}
                        isSelected={selectedId === snap.id}
                        isLoading={loadingId === snap.id}
                        onClick={() => onSelect(snap.id)}
                      />
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            )}
          </div>

          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent z-10" />
          )}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy(200)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll timeline right"
          >
            ▸
          </button>
        )}

        {/* Now button */}
        <button
          type="button"
          onClick={handleNowClick}
          disabled={isAtRightEdge && selectedId === null}
          className="shrink-0 px-2 h-7 flex items-center rounded border border-border bg-background text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-default hover:enabled:text-foreground text-muted-foreground"
        >
          Now
        </button>
      </div>
    </div>
  );
}
