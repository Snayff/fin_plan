import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/utils/motion";

interface SkeletonLoaderProps {
  variant: "left-panel" | "right-panel";
  className?: string;
}

function Block({ className }: { className?: string }) {
  return <div className={cn("rounded bg-muted", className)} />;
}

export function SkeletonLoader({ variant, className }: SkeletonLoaderProps) {
  const reduced = usePrefersReducedMotion();

  const shimmer = reduced
    ? ""
    : "relative overflow-hidden before:absolute before:inset-0 before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  if (variant === "left-panel") {
    return (
      <div role="status" aria-label="Loading…" className={cn("space-y-3 p-4", shimmer, className)}>
        <Block className="h-8 w-full" />
        <Block className="h-8 w-full" />
        <Block className="h-8 w-full" />
        <Block className="h-8 w-full" />
        <Block className="h-1 w-3/4 mt-2" />
        <Block className="h-1 w-1/2" />
        <Block className="h-1 w-2/3" />
      </div>
    );
  }

  return (
    <div role="status" aria-label="Loading…" className={cn("space-y-4 p-6", shimmer, className)}>
      <Block className="h-12 w-2/3" />
      <Block className="h-40 w-full" />
      <div className="flex gap-2">
        <Block className="h-8 w-24" />
        <Block className="h-8 w-24" />
      </div>
    </div>
  );
}
