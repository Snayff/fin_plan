import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const GHOST_WIDTHS = [100, 140, 80, 120];
const GHOST_OPACITIES = [1, 0.8, 0.5, 0.25];

interface GhostedListEmptyProps {
  rowCount?: number;
  ctaHeading?: string;
  ctaText: string;
  ctaSteps?: string[];
  ctaButtonLabel?: string;
  onCtaClick?: () => void;
  showCta?: boolean;
}

export function GhostedListEmpty({
  rowCount = 3,
  ctaHeading,
  ctaText,
  ctaSteps,
  ctaButtonLabel = "+ Add",
  onCtaClick,
  showCta = true,
}: GhostedListEmptyProps) {
  const isAddable = showCta && !!onCtaClick && !!ctaHeading;

  return (
    <div className="py-2">
      {/* Fading skeleton rows — only for informational/contextual variants */}
      {!isAddable && (
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
      )}

      {/* CTA card */}
      {showCta && onCtaClick && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-2 mt-3 flex items-center justify-between gap-3 rounded-lg p-3.5"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
          }}
        >
          <div className="flex flex-col gap-1 min-w-0">
            {ctaHeading && (
              <span className="text-xs font-medium text-foreground/80 leading-snug">
                {ctaHeading}
              </span>
            )}
            <span className="text-xs text-muted-foreground leading-snug">{ctaText}</span>
            {ctaSteps && ctaSteps.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {ctaSteps.map((step) => (
                  <li
                    key={step}
                    className="flex items-start gap-1.5 text-xs text-foreground/50 leading-snug"
                  >
                    <span
                      className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-foreground/30"
                      aria-hidden
                    />
                    {step}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button size="sm" type="button" onClick={onCtaClick} className="shrink-0 self-start">
            {ctaButtonLabel}
          </Button>
        </motion.div>
      )}

      {/* Informational-only text (showCta=false, no button) */}
      {!showCta && ctaText && (
        <p className="px-3 py-2 text-xs text-muted-foreground italic">{ctaText}</p>
      )}
    </div>
  );
}
