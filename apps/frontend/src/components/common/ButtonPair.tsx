import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

interface ButtonPairProps {
  leftLabel: string;
  rightLabel: string;
  onLeftClick: () => void;
  onRightClick: () => void;
  leftVariant?: ButtonVariant;
  rightVariant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  /** When true, clicking the right button triggers a brief success colour flash */
  rightClickFlash?: boolean;
  className?: string;
}

export function ButtonPair({
  leftLabel,
  rightLabel,
  onLeftClick,
  onRightClick,
  leftVariant = "outline",
  rightVariant = "default",
  isLoading = false,
  disabled = false,
  rightClickFlash = false,
  className,
}: ButtonPairProps) {
  const [flashing, setFlashing] = useState(false);

  const handleRightClick = useCallback(() => {
    if (rightClickFlash) {
      setFlashing(true);
      setTimeout(() => setFlashing(false), 700);
    }
    onRightClick();
  }, [rightClickFlash, onRightClick]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={leftVariant}
        size="sm"
        onClick={onLeftClick}
        disabled={disabled || isLoading}
      >
        {leftLabel}
      </Button>
      <Button
        variant={flashing ? "outline" : rightVariant}
        size="sm"
        onClick={handleRightClick}
        disabled={disabled}
        aria-busy={isLoading}
        style={
          flashing
            ? {
                borderColor: "hsl(var(--success) / 0.6)",
                color: "hsl(var(--success))",
                transition: "border-color 150ms ease-out, color 150ms ease-out",
              }
            : undefined
        }
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {rightLabel}
          </span>
        ) : (
          rightLabel
        )}
      </Button>
    </div>
  );
}
