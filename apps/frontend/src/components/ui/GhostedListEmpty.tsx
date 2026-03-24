import { Button } from "@/components/ui/button";

const GHOST_WIDTHS = [100, 140, 80, 120];
const GHOST_OPACITIES = [1, 0.8, 0.5, 0.25];

interface GhostedListEmptyProps {
  rowCount?: number;
  ctaText: string;
  ctaButtonLabel?: string;
  onCtaClick?: () => void;
  showCta?: boolean;
}

export function GhostedListEmpty({
  rowCount = 3,
  ctaText,
  ctaButtonLabel = "+ Add",
  onCtaClick,
  showCta = true,
}: GhostedListEmptyProps) {
  return (
    <div className="py-2">
      {/* Fading skeleton rows */}
      <div className="space-y-1">
        {Array.from({ length: rowCount }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-3"
            style={{ opacity: GHOST_OPACITIES[Math.min(i, GHOST_OPACITIES.length - 1)] }}
          >
            <div
              className="h-2.5 rounded-full"
              style={{
                width: GHOST_WIDTHS[i % GHOST_WIDTHS.length],
                background: "rgba(255, 255, 255, 0.04)",
              }}
            />
            <div
              className="h-2.5 w-16 rounded-full"
              style={{ background: "rgba(255, 255, 255, 0.03)" }}
            />
          </div>
        ))}
      </div>

      {/* CTA card */}
      {showCta && onCtaClick && (
        <div
          className="mx-2 mt-3 flex items-center justify-between gap-3 rounded-lg p-3.5"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(168, 85, 247, 0.05) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
          }}
        >
          <span className="text-[12.5px] text-muted-foreground leading-snug">{ctaText}</span>
          <Button size="sm" onClick={onCtaClick} className="shrink-0">
            {ctaButtonLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
