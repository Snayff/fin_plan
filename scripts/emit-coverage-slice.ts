/**
 * Emit a true-coverage slice for one package — the CI gate's input.
 *
 * Runs the package's tests in isolation with lcov, merges to true whole-codebase
 * coverage, and writes `{ "<pkg-key>": { functions, lines } }` to the output
 * path (default: coverage-current.json at the repo root).
 *
 * Usage:
 *   bun scripts/emit-coverage-slice.ts <pkg-key> <pkg-dir> [out]
 *
 * Example (CI, run from the package dir or repo root):
 *   bun ../../scripts/emit-coverage-slice.ts apps/backend apps/backend ../../coverage-current.json
 */

import { runLcovCoverage } from "./run-lcov-coverage";
import { writeCoverageSlice } from "./coverage-utils";

const [pkgKey, pkgDir, out] = process.argv.slice(2);

if (!pkgKey || !pkgDir) {
  console.error("usage: bun scripts/emit-coverage-slice.ts <pkg-key> <pkg-dir> [out]");
  process.exit(1);
}

const outPath = out ?? "coverage-current.json";

const { totals, filesInstrumented, failedFiles } = await runLcovCoverage(pkgDir, (done, total) => {
  if (done === 0) console.log(`${pkgKey}: ${total} isolated runs...`);
  else if (done % 25 === 0) process.stdout.write(`  ...${done}/${total}\n`);
});

console.log(
  `${pkgKey}: lines ${totals.lines}% (${totals.lineHit}/${totals.lineFound}), ` +
    `functions ${totals.functions}% (${totals.fnHit}/${totals.fnFound}), ` +
    `${filesInstrumented} files`
);

writeCoverageSlice(pkgKey, { functions: totals.functions, lines: totals.lines }, outPath);
console.log(`wrote ${outPath}`);

// The emitter doubles as the test gate: a non-zero exit on any test file fails CI.
if (failedFiles.length > 0) {
  console.error(`\n❌ ${failedFiles.length} test file(s) failed:`);
  for (const f of failedFiles) console.error(`  - ${f}`);
  process.exit(1);
}
