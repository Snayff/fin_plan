/**
 * Isolated test runner for bun test.
 *
 * Bun's mock.module() patches the global module cache, so mocks defined in one
 * test file leak into every other file within the same process. This script
 * spawns a separate `bun test` process per file to guarantee isolation.
 *
 * Supports `--watch` to re-run affected test files on save (see watch-mode.ts).
 */

import { Glob } from "bun";
import { filterTestFiles } from "./test-runner-helpers";
import {
  meanCoverage,
  parseBunCoverageRow,
  writeCoverageSlice,
} from "../../../scripts/coverage-utils";

const preload = "./src/test/setup.ts";
const testDir = "src";

const glob = new Glob("**/*.test.ts");
const testFiles = Array.from(glob.scanSync(testDir)).sort();

const coverage = process.argv.includes("--coverage");
const watch = process.argv.includes("--watch");

const filterPattern = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const filesToRun = filterTestFiles(testFiles, filterPattern);

export async function runFiles(files: string[]): Promise<number> {
  if (files.length === 0) {
    console.log("No test files matched.");
    return 0;
  }

  console.log(`Running ${files.length} test file(s) with per-file isolation...\n`);

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];
  const coverageRows: Array<{ functions: number; lines: number }> = [];

  for (const file of files) {
    const filePath = `${testDir}/${file}`;
    const usePipe = coverage;
    const proc = Bun.spawn(
      ["bun", "test", ...(coverage ? ["--coverage"] : []), "--preload", preload, filePath],
      {
        stdout: usePipe ? "pipe" : "inherit",
        // Pipe stderr too when coverage is on — Bun writes its coverage table to stderr,
        // so we need to capture it for parsing while still forwarding it to the terminal.
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
    if (exitCode === 0) passed++;
    else {
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
    for (const f of failures) console.log(`  - ${f}`);
  }

  if (coverage && coverageRows.length > 0) {
    const slice = meanCoverage(coverageRows);
    // Write to repo root (three levels up from apps/backend/scripts).
    writeCoverageSlice("apps/backend", slice, "../../coverage-current.json");
    console.log(
      `\nwrote coverage-current.json (functions ${slice.functions}%, lines ${slice.lines}%)`
    );
  } else if (coverage) {
    console.warn("⚠ could not parse any coverage rows; coverage-current.json not written");
  }

  return failed > 0 ? 1 : 0;
}

if (watch) {
  await import("./watch-mode").then((m) =>
    m.startWatchMode({ testFiles, filterPattern, runFiles })
  );
} else {
  process.exit(await runFiles(filesToRun));
}
