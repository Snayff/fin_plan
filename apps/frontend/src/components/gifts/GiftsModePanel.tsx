import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiftPersonList } from "./GiftPersonList";
import { GiftPersonDetail } from "./GiftPersonDetail";
import { usePrefersReducedMotion } from "@/utils/motion";
import type { GiftPersonRow } from "@finplan/shared";

type Props = {
  people: GiftPersonRow[];
  year: number;
  readOnly: boolean;
};

export function GiftsModePanel({ people, year, readOnly }: Props) {
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [dir, setDir] = useState(1);
  const reduced = usePrefersReducedMotion();

  const slide = {
    initial: (d: number) => ({ x: reduced ? 0 : d * 24, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.18, ease: [0.25, 1, 0.5, 1] } },
    exit: (d: number) => ({
      x: reduced ? 0 : -d * 24,
      opacity: 0,
      transition: { duration: 0.15 },
    }),
  };

  const selectPerson = (id: string) => {
    setDir(1);
    setActivePersonId(id);
  };

  const goBack = () => {
    setDir(-1);
    setActivePersonId(null);
  };

  return (
    <AnimatePresence mode="wait" custom={dir}>
      {activePersonId ? (
        <motion.div
          key={activePersonId}
          custom={dir}
          variants={slide}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full"
        >
          <GiftPersonDetail
            personId={activePersonId}
            year={year}
            onBack={goBack}
            readOnly={readOnly}
          />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          custom={dir}
          variants={slide}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full"
        >
          <GiftPersonList people={people} onSelect={selectPerson} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
