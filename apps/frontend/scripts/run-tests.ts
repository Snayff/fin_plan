/**
 * Isolated test runner for bun test.
 *
 * Bun's mock.module() patches the global module cache, so mocks defined in one
 * test file leak into every other file within the same process. This script
 * spawns a separate `bun test` process per file to guarantee isolation.
 *
 * With `--coverage` it captures each file's Bun coverage table, averages the
 * per-file "All files" rows, and writes a single-package slice to
 * `coverage-current.json` at the repo root (consumed by the CI coverage gate).
 */

import { Glob } from "bun";
import { resolve } from "node:path";
import {
  meanCoverage,
  parseBunCoverageRow,
  writeCoverageSlice,
} from "../../../scripts/coverage-utils";

const preload = "./src/test/setup.ts";
const testDir = "src";

const glob = new Glob("**/*.test.{ts,tsx}");
const testFiles = Array.from(glob.scanSync(testDir)).sort();

const coverage = process.argv.includes("--coverage");

// Allow filtering by pattern passed as CLI arg: `bun scripts/run-tests.ts auth`
const filterPattern = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const filesToRun = filterPattern ? testFiles.filter((f) => f.includes(filterPattern)) : testFiles;

if (filesToRun.length === 0) {
  console.log("No test files matched.");
  process.exit(0);
}

console.log(`Running ${filesToRun.length} test file(s) with per-file isolation...\n`);

let passed = 0;
let failed = 0;
const failures: string[] = [];
const coverageRows: Array<{ functions: number; lines: number }> = [];

for (const file of filesToRun) {
  // Use an absolute path so bun treats it as an exact file, not a glob pattern.
  // Without this, `bun test src/hooks/foo.test.ts` also picks up `foo.test.tsx`
  // in the same process, causing mock.module() leaks between files.
  const filePath = resolve(testDir, file);
  const usePipe = coverage;
  const proc = Bun.spawn(
    ["bun", "test", ...(coverage ? ["--coverage"] : []), "--preload", preload, filePath],
    {
      stdout: usePipe ? "pipe" : "inherit",
      // Bun writes its coverage table to stderr, so capture it when coverage is
      // on while still forwarding both streams to the terminal.
      stderr: usePipe ? "pipe" : "inherit",
      env: process.env,
    }
  );

  let combined = "";
  if (usePipe) {
    // Read both streams concurrently to prevent deadlock if either buffer fills.
    const [stdoutText, stderrText] = await Promise.all([
      proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
      proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
    ]);
    process.stdout.write(stdoutText);
    process.stderr.write(stderrText);
    combined = stdoutText + "\n" + stderrText;
  }

  const exitCode = await proc.exited;

  if (exitCode === 0) {
    passed++;
  } else {
    failed++;
    failures.push(filePath);
  }

  if (usePipe && combined) {
    const row = parseBunCoverageRow(combined);
    if (row) coverageRows.push(row);
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Test files: ${passed + failed} total, ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log(`\nFailed files:`);
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}

if (coverage && coverageRows.length > 0) {
  const slice = meanCoverage(coverageRows);
  // Write to repo root (three levels up from apps/frontend/scripts).
  writeCoverageSlice("apps/frontend", slice, "../../coverage-current.json");
  console.log(
    `\nwrote coverage-current.json (functions ${slice.functions}%, lines ${slice.lines}%)`
  );
} else if (coverage) {
  console.warn("⚠ could not parse any coverage rows; coverage-current.json not written");
}

process.exit(failed > 0 ? 1 : 0);
