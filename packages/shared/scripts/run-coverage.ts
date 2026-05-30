/**
 * Coverage emitter for the shared package.
 *
 * The shared package has no module-mock isolation concerns, so it runs as a
 * single `bun test --coverage` process. This script captures that run's
 * coverage table and writes a single-package slice to `coverage-current.json`
 * at the repo root (consumed by the CI coverage gate).
 */

import { parseBunCoverageRow, writeCoverageSlice } from "../../../scripts/coverage-utils";

const proc = Bun.spawn(["bun", "test", "--coverage"], {
  stdout: "pipe",
  // Bun writes its coverage table to stderr; capture both and forward them.
  stderr: "pipe",
  env: process.env,
});

const [stdoutText, stderrText] = await Promise.all([
  proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
  proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
]);
process.stdout.write(stdoutText);
process.stderr.write(stderrText);

const exitCode = await proc.exited;

const row = parseBunCoverageRow(stdoutText + "\n" + stderrText);
if (row) {
  // Write to repo root (three levels up from packages/shared/scripts).
  writeCoverageSlice("packages/shared", row, "../../coverage-current.json");
  console.log(`\nwrote coverage-current.json (functions ${row.functions}%, lines ${row.lines}%)`);
} else {
  console.warn("⚠ could not parse coverage row; coverage-current.json not written");
}

process.exit(exitCode);
