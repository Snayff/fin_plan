/**
 * Ratchet helper — lock in coverage gains.
 *
 * After a batch of new tests lands and coverage rises, run this to:
 *   1. raise each package entry in `coverage-baseline.json` to the new current
 *      figure (so the 1pp ratchet now defends the higher number), and
 *   2. print the suggested new per-package floors for `check-coverage.ts`
 *      (a fixed margin below the new baseline, capped at the 90% target).
 *
 * It never lowers a baseline — a dip is left for the ratchet to flag, not
 * silently accepted.
 *
 * Usage:
 *   bun scripts/bump-baseline.ts coverage-current.json [--margin 2] [--write-floors]
 */

import { readFileSync, writeFileSync } from "node:fs";

interface PackageCoverage {
  functions: number;
  lines: number;
}

const TARGET = { functions: 90, lines: 90 };
const BASELINE_PATH = "coverage-baseline.json";

const args = process.argv.slice(2);
const currentPath = args.find((a) => !a.startsWith("--")) ?? "coverage-current.json";
const marginIdx = args.indexOf("--margin");
const margin = marginIdx >= 0 ? Number(args[marginIdx + 1]) : 2;

const current = JSON.parse(readFileSync(currentPath, "utf8")) as Record<string, PackageCoverage>;
const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Record<string, PackageCoverage>;

let changed = false;
const suggestedFloors: Record<string, PackageCoverage> = {};

for (const [pkg, cur] of Object.entries(current)) {
  const base = baseline[pkg] ?? { functions: 0, lines: 0 };
  const raised: PackageCoverage = {
    functions: Math.max(base.functions, cur.functions),
    lines: Math.max(base.lines, cur.lines),
  };
  if (raised.functions !== base.functions || raised.lines !== base.lines) {
    changed = true;
    console.log(
      `  ${pkg}: baseline ${base.functions}/${base.lines} → ${raised.functions}/${raised.lines}`
    );
  }
  baseline[pkg] = raised;

  // Floor = a margin below the locked baseline, never above the 90% target.
  suggestedFloors[pkg] = {
    functions: Math.min(TARGET.functions, Math.max(0, Math.floor(raised.functions - margin))),
    lines: Math.min(TARGET.lines, Math.max(0, Math.floor(raised.lines - margin))),
  };
}

if (changed) {
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`\n✅ updated ${BASELINE_PATH}`);
} else {
  console.log("No baseline increases — coverage did not rise above the recorded baseline.");
}

console.log(
  `\nSuggested floors for scripts/check-coverage.ts (margin ${margin}pp, cap ${TARGET.lines}):`
);
console.log("    floors: {");
for (const [pkg, f] of Object.entries(suggestedFloors)) {
  console.log(`      "${pkg}": { functions: ${f.functions}, lines: ${f.lines} },`);
}
console.log("    },");

const allAtTarget = Object.values(suggestedFloors).every(
  (f) => f.functions >= TARGET.functions && f.lines >= TARGET.lines
);
if (allAtTarget) {
  console.log(`\n🎉 every package floor has reached the ${TARGET.lines}% target.`);
}
