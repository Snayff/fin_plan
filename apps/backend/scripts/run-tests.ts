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
import { writeFileSync } from "node:fs";
import { filterTestFiles } from "./test-runner-helpers";

function parseBunCoverageRow(output: string): { functions: number; lines: number } | null {
  const allFilesLine = output
    .split("\n")
    .reverse()
    .find((l) => /^\s*All files\s*\|/.test(l));
  if (!allFilesLine) return null;
  const parts = allFilesLine.split("|").map((p) => p.trim());
  // Bun coverage table: File | % Funcs | % Lines | Uncovered Line #s
  const functions = Number(parts[1]);
  const lines = Number(parts[2]);
  if (Number.isNaN(functions) || Number.isNaN(lines)) return null;
  return { functions, lines };
}

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
        stderr: "inherit",
        env: process.env,
      }
    );

    let stdout = "";
    if (usePipe && proc.stdout) {
      stdout = await new Response(proc.stdout).text();
      process.stdout.write(stdout);
    }

    const exitCode = await proc.exited;
    if (exitCode === 0) passed++;
    else {
      failed++;
      failures.push(filePath);
    }

    if (usePipe && stdout) {
      const row = parseBunCoverageRow(stdout);
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
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const meanFunctions = Math.round(avg(coverageRows.map((r) => r.functions)) * 10) / 10;
    const meanLines = Math.round(avg(coverageRows.map((r) => r.lines)) * 10) / 10;
    const currentJson = JSON.stringify(
      { "apps/backend": { functions: meanFunctions, lines: meanLines } },
      null,
      2
    );
    // Write to repo root (two levels up from apps/backend)
    writeFileSync("../../coverage-current.json", currentJson);
    console.log(`\nwrote coverage-current.json (functions ${meanFunctions}%, lines ${meanLines}%)`);
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
