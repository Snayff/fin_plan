/**
 * True whole-codebase coverage reporter / gap-finder.
 *
 * Runs each test file in isolation emitting an lcov report, merges the reports
 * per source file (see scripts/coverage-utils.ts), and prints the real
 * line/function percentages. With `--table` it lists the lowest-covered files —
 * the prioritized worklist for writing tests. With `--out` it writes a
 * single-package slice for the CI coverage gate.
 *
 * Usage:
 *   bun scripts/coverage-report.ts <pkg-key> <pkg-dir> [--out <slice.json>] [--table]
 */

import { runLcovCoverage } from "./run-lcov-coverage";
import { writeCoverageSlice } from "./coverage-utils";

const args = process.argv.slice(2);
const pkgKey = args[0];
const pkgDir = args[1];
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;
const showTable = args.includes("--table");

if (!pkgKey || !pkgDir) {
  console.error(
    "usage: bun scripts/coverage-report.ts <pkg-key> <pkg-dir> [--out <slice.json>] [--table]"
  );
  process.exit(1);
}

const { totals, filesInstrumented } = await runLcovCoverage(pkgDir, (done, total) => {
  if (done === 0) console.log(`Measuring true coverage for ${pkgKey} — ${total} isolated runs...`);
  else if (done % 25 === 0) process.stdout.write(`  ...${done}/${total}\n`);
});

console.log(`\n${"=".repeat(60)}`);
console.log(`${pkgKey} TRUE whole-codebase coverage (${filesInstrumented} files instrumented):`);
console.log(`  lines:     ${totals.lines}%  (${totals.lineHit}/${totals.lineFound})`);
console.log(`  functions: ${totals.functions}%  (${totals.fnHit}/${totals.fnFound})`);

if (showTable) {
  console.log(`\nLowest-covered source files (by line %):`);
  totals.perFile
    .sort((a, b) => a.linePct - b.linePct)
    .slice(0, 30)
    .forEach((f) => {
      console.log(`  ${f.linePct.toFixed(0).padStart(3)}%  ${f.lh}/${f.lf}  ${f.sf}`);
    });
}

if (outPath) {
  writeCoverageSlice(pkgKey, { functions: totals.functions, lines: totals.lines }, outPath);
  console.log(`\nwrote ${outPath}`);
}
