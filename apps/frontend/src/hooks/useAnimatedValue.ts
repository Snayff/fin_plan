import { useRef, useState, useEffect } from "react";
import { usePrefersReducedMotion } from "@/utils/motion";

const DURATION = 550;
const POWER = 4;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, POWER);
}

function roundTo(value: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Animates a numeric value with a snappy ease-out curve.
 * Races through most of the range quickly, then the last few
 * ticks crawl in — giving a satisfying "tick up" feel.
 *
 * Returns the current interpolated value, rounded to `decimalPlaces`.
 * Skips animation when `prefers-reduced-motion` is active.
 */
export function useAnimatedValue(target: number, decimalPlaces = 0): number {
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(target);
      return;
    }

    // Capture current displayed value as start point
    const startValue = display;
    const delta = target - startValue;

    const threshold = decimalPlaces > 0 ? 0.005 : 1;
    if (Math.abs(delta) < threshold) {
      setDisplay(target);
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const startTime = performance.now();
    startRef.current = { value: startValue, time: startTime };

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const easedProgress = easeOut(progress);

      const current = startValue + delta * easedProgress;

      if (progress < 1) {
        setDisplay(roundTo(current, decimalPlaces));
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        rafRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from current display value to new target
  }, [target, decimalPlaces, prefersReduced]);

  return display;
}
