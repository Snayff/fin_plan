import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/utils/motion";

type Direction = "deeper" | "shallower" | "empty";

interface PanelTransitionProps {
  children: ReactNode;
  direction: Direction;
  id: string; // unique key to trigger animation on change
}

const VARIANTS = {
  deeper: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  },
  shallower: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
  },
  empty: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

const DURATION = 0.15;

export function PanelTransition({ children, direction, id }: PanelTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const variants = VARIANTS[direction];

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ duration: DURATION, ease: direction === "empty" ? "easeIn" : "easeOut" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
