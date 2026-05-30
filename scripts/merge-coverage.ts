/**
 * Merge per-suite coverage slices into a single `coverage-current.json`.
 *
 * Usage:
 *   bun scripts/merge-coverage.ts <out> <slice...>
 *
 * Example (CI coverage gate, after downloading the suite artefacts):
 *   bun scripts/merge-coverage.ts coverage-current.json \
 *     coverage-backend/coverage-current.json \
 *     coverage-frontend/coverage-current.json \
 *     coverage-shared/coverage-current.json
 */

import { writeFileSync } from "node:fs";
import { mergeCoverageSlices } from "./coverage-utils";

const [out, ...slices] = process.argv.slice(2);

if (!out || slices.length === 0) {
  console.error("usage: bun scripts/merge-coverage.ts <out> <slice...>");
  process.exit(1);
}

const merged = mergeCoverageSlices(slices);

if (Object.keys(merged).length === 0) {
  console.error("❌ no coverage slices found — nothing to merge");
  process.exit(1);
}

writeFileSync(out, JSON.stringify(merged, null, 2) + "\n");
console.log(`✅ merged ${Object.keys(merged).length} package(s) into ${out}:`);
for (const [pkg, cov] of Object.entries(merged)) {
  console.log(`  ${pkg}: functions ${cov.functions}%, lines ${cov.lines}%`);
}
