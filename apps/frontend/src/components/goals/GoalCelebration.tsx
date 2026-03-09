import { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  variant: number; // 1–5
  onComplete: () => void;
}

const PALETTE = ['#FF7A18', '#07BEB8', '#B38BA3', '#FFD700', '#FF6B6B', '#4ECDC4', '#A8E6CF', '#FFB347'];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

// --- Variant 1: Confetti burst (coloured rectangles tumbling down) ---
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: rand(5, 95),
        delay: rand(0, 0.6),
        width: rand(8, 16),
        height: rand(4, 10),
        color: pickColor(),
        rotate: rand(0, 360),
        rotateEnd: rand(-360, 360),
      })),
    []
  );
  return (
    <>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: '-2%',
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: 2,
            pointerEvents: 'none',
            rotate: p.rotate,
          }}
          animate={{
            top: '110%',
            rotate: p.rotateEnd,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: rand(1.5, 2.5), delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </>
  );
}

// --- Variant 2: Coin shower (gold circles raining down) ---
function CoinShower() {
  const coins = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: rand(5, 95),
        delay: rand(0, 0.8),
        size: rand(14, 26),
      })),
    []
  );
  return (
    <>
      {coins.map((c) => (
        <motion.div
          key={c.id}
          style={{
            position: 'fixed',
            left: `${c.x}%`,
            top: '-3%',
            width: c.size,
            height: c.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #FFE566, #FFB700)',
            border: '1px solid #CC8800',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: c.size * 0.5,
          }}
          animate={{
            top: '110%',
            rotate: [0, 360],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: rand(1.2, 2.2), delay: c.delay, ease: 'easeIn' }}
        >
          <span style={{ fontSize: c.size * 0.45, lineHeight: 1 }} aria-hidden="true">£</span>
        </motion.div>
      ))}
    </>
  );
}

// --- Variant 3: Star scatter (★ symbols burst from centre) ---
function StarScatter() {
  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 360 + rand(-15, 15);
        const dist = rand(120, 380);
        const rad = (angle * Math.PI) / 180;
        return {
          id: i,
          dx: Math.cos(rad) * dist,
          dy: Math.sin(rad) * dist,
          delay: rand(0, 0.3),
          size: rand(18, 36),
          color: pickColor(),
        };
      }),
    []
  );
  return (
    <>
      {stars.map((s) => (
        <motion.div
          key={s.id}
          style={{
            position: 'fixed',
            left: '50%',
            top: '40%',
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            fontSize: s.size,
            color: s.color,
            pointerEvents: 'none',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: s.dx, y: s.dy, opacity: [1, 1, 0], scale: [0, 1.4, 1] }}
          transition={{ duration: 1.2, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          ★
        </motion.div>
      ))}
    </>
  );
}

// --- Variant 4: Fireworks pop (radial dot bursts) ---
function Fireworks() {
  const bursts = useMemo(
    () =>
      [
        { cx: 25, cy: 25, color: '#FF7A18' },
        { cx: 60, cy: 35, color: '#07BEB8' },
        { cx: 75, cy: 20, color: '#B38BA3' },
      ].map((b, bi) =>
        Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360;
          const dist = rand(60, 120);
          const rad = (angle * Math.PI) / 180;
          return {
            id: `${bi}-${i}`,
            left: `${b.cx}%`,
            top: `${b.cy}%`,
            dx: Math.cos(rad) * dist,
            dy: Math.sin(rad) * dist,
            color: b.color,
            delay: bi * 0.25 + rand(0, 0.1),
          };
        })
      ).flat(),
    []
  );
  return (
    <>
      {bursts.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'fixed',
            left: p.left,
            top: p.top,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: p.color,
            pointerEvents: 'none',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: [0, 1, 1, 0], scale: [0, 1.5, 1, 0] }}
          transition={{ duration: 1.0, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

// --- Variant 5: Balloon float (ovals drifting up) ---
function BalloonFloat() {
  const balloons = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: rand(10, 90),
        delay: rand(0, 0.5),
        color: pickColor(),
        size: rand(28, 44),
        drift: rand(-60, 60),
      })),
    []
  );
  return (
    <>
      {balloons.map((b) => (
        <motion.div
          key={b.id}
          style={{
            position: 'fixed',
            left: `${b.x}%`,
            bottom: '-5%',
            width: b.size,
            height: b.size * 1.25,
            borderRadius: '50%',
            backgroundColor: b.color,
            opacity: 0.9,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          animate={{
            bottom: '110%',
            x: [0, b.drift, -b.drift / 2, b.drift / 3],
            opacity: [0.9, 0.9, 0.9, 0],
          }}
          transition={{
            duration: rand(2.0, 2.8),
            delay: b.delay,
            ease: 'easeOut',
            x: { duration: rand(2.0, 2.8), delay: b.delay, ease: 'easeInOut' },
          }}
        >
          {/* balloon string */}
          <div
            style={{
              width: 1,
              height: b.size * 0.8,
              backgroundColor: b.color,
              marginTop: b.size * 1.2,
              opacity: 0.6,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

const VARIANTS: Record<number, () => JSX.Element> = {
  1: Confetti,
  2: CoinShower,
  3: StarScatter,
  4: Fireworks,
  5: BalloonFloat,
};

export default function GoalCelebration({ variant, onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const Animation = VARIANTS[variant] ?? Confetti;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        <Animation />
      </AnimatePresence>
    </div>,
    document.body
  );
}
