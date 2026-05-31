/**
 * Run a package's test suite with per-file isolation, emitting lcov, and merge
 * the reports into true whole-codebase coverage.
 *
 * Shared by the gap-finder (coverage-report.ts) and the CI slice emitters so
 * the gate and the diagnostic always agree on the number.
 */

import { Glob } from "bun";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  type CoverageTotals,
  type LcovAccumulator,
  mergeLcov,
  newLcovAccumulator,
  tallyLcov,
} from "./coverage-utils";

export interface LcovRunResult {
  totals: CoverageTotals;
  /** Number of source files that appeared in at least one lcov report. */
  filesInstrumented: number;
  accumulator: LcovAccumulator;
  /** Test files that exited non-zero. Empty when the suite is green. */
  failedFiles: string[];
}

/**
 * @param pkgDir   Package directory (relative or absolute), e.g. "apps/backend".
 * @param onProgress Optional callback `(done, total)` — called with (0, total)
 *                   up front, then after each file completes.
 */
export async function runLcovCoverage(
  pkgDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<LcovRunResult> {
  const absPkg = resolve(pkgDir);
  const testGlob = new Glob("**/*.test.{ts,tsx}");
  const testFiles = Array.from(testGlob.scanSync(join(absPkg, "src"))).sort();

  if (testFiles.length === 0) {
    throw new Error(`no test files found under ${absPkg}/src`);
  }

  const preloadPath = join(absPkg, "src/test/setup.ts");
  const preloadArgs = existsSync(preloadPath) ? ["--preload", preloadPath] : [];
  const tmpRoot = mkdtempSync(join(tmpdir(), "cov-"));
  const acc = newLcovAccumulator();
  const failedFiles: string[] = [];

  onProgress?.(0, testFiles.length);

  let i = 0;
  for (const file of testFiles) {
    i++;
    const dir = join(tmpRoot, String(i));
    const filePath = join(absPkg, "src", file);
    const proc = Bun.spawn(
      [
        "bun",
        "test",
        "--coverage",
        "--coverage-reporter=lcov",
        `--coverage-dir=${dir}`,
        ...preloadArgs,
        filePath,
      ],
      { stdout: "ignore", stderr: "ignore", cwd: absPkg, env: process.env }
    );
    const exitCode = await proc.exited;
    if (exitCode !== 0) failedFiles.push(file);
    try {
      mergeLcov(readFileSync(join(dir, "lcov.info"), "utf8"), acc);
    } catch {
      // A file that produced no lcov (e.g. all tests errored) contributes nothing.
    }
    onProgress?.(i, testFiles.length);
  }

  return { totals: tallyLcov(acc), filesInstrumented: acc.size, accumulator: acc, failedFiles };
}
