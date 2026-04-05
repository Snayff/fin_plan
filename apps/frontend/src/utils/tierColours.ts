// Tailwind colour scales — brightest to darkest
const INDIGO_SCALE = [
  "#818cf8", // indigo-400
  "#6366f1", // indigo-500
  "#4f46e5", // indigo-600
  "#4338ca", // indigo-700
  "#3730a3", // indigo-800
  "#312e81", // indigo-900
  "#1e1b4b", // indigo-950
] as const;

const PURPLE_SCALE = [
  "#c084fc", // purple-400
  "#a855f7", // purple-500
  "#9333ea", // purple-600
  "#7e22ce", // purple-700
  "#6b21a8", // purple-800
  "#581c87", // purple-900
  "#3b0764", // purple-950
] as const;

const TIER_SCALES: Record<"committed" | "discretionary", readonly string[]> = {
  committed: INDIGO_SCALE,
  discretionary: PURPLE_SCALE,
};

/**
 * Generate an array of colours for a tier's subcategory segments.
 * Index 0 = brightest (assigned to the largest-value subcategory).
 * Capped at 7.
 */
export function generateTierColours(tier: "committed" | "discretionary", count: number): string[] {
  const scale = TIER_SCALES[tier];
  const n = Math.min(Math.max(count, 0), 7);
  if (n === 0) return [];

  if (n === 1) return [scale[0]!];

  // Evenly space across the scale
  return Array.from({ length: n }, (_, i) => {
    const idx = Math.round((i / (n - 1)) * (scale.length - 1));
    return scale[idx]!;
  });
}
