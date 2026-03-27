import { useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useGlossaryPopover } from "./GlossaryPopoverContext";
import { getGlossaryEntry } from "@/data/glossary";
import { getConceptEntry } from "@/data/concepts";
import { usePrefersReducedMotion } from "@/utils/motion";
import { cn } from "@/lib/utils";

interface Props {
  entryId: string;
  children: ReactNode;
}

export function GlossaryTermMarker({ entryId, children }: Props) {
  const { openId, openPopover, closePopover } = useGlossaryPopover();
  const isOpen = openId === entryId;
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const entry = getGlossaryEntry(entryId);

  const scheduleOpen = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => openPopover(entryId), 150);
  };

  const scheduleClose = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(closePopover, 300);
  };

  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  // Keyboard: Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePopover();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closePopover]);

  if (!entry) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="border-b border-dotted border-current/50 cursor-help"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={() => openPopover(entryId)}
        onBlur={scheduleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isOpen) {
              closePopover();
            } else {
              openPopover(entryId);
            }
          }
        }}
      >
        {children}
      </span>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Definition: ${entry.term}`}
          className={cn(
            "absolute left-0 top-full mt-1 z-[70] w-72 rounded-lg border bg-card p-3 shadow-lg",
            reduced ? "" : "animate-in fade-in duration-150"
          )}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <p className="text-xs font-semibold text-foreground mb-1">{entry.term}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{entry.definition}</p>

          {entry.relatedConceptIds.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[11px] text-muted-foreground/70 mb-1">Related</p>
              <div className="flex flex-wrap gap-1">
                {entry.relatedConceptIds.map((conceptId) => {
                  const concept = getConceptEntry(conceptId);
                  if (!concept) return null;
                  return (
                    <Link
                      key={conceptId}
                      to={`/help?entry=${conceptId}`}
                      className="text-[11px] text-foreground/60 hover:text-foreground underline transition-colors"
                      onClick={closePopover}
                    >
                      {concept.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-2 pt-2 border-t">
            <Link
              to={`/help?entry=${entryId}`}
              className="text-[11px] text-foreground/60 hover:text-foreground transition-colors"
              onClick={closePopover}
            >
              Learn more<span aria-hidden> →</span>
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}
