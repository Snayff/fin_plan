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
  className,
}: ButtonPairProps) {
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
        variant={rightVariant}
        size="sm"
        onClick={onRightClick}
        disabled={disabled}
        aria-busy={isLoading}
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
