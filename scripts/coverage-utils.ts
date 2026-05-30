import { existsSync, readFileSync, writeFileSync } from "node:fs";

/**
 * Shared helpers for producing and combining coverage slices.
 *
 * Each test suite (backend, frontend, shared) emits a single-package "slice"
 * — `{ "<pkg>": { functions, lines } }` — written to `coverage-current.json`.
 * In CI each suite runs in its own job, uploads its slice as an artefact, and
 * the coverage-gate job merges them back into one object for `check-coverage`.
 */

export interface PackageCoverage {
  functions: number;
  lines: number;
}

/**
 * Parse the "All files" summary row from a Bun coverage table.
 *
 * Bun prints the table as `File | % Funcs | % Lines | Uncovered Line #s`. We
 * scan from the bottom so the final (cumulative) table wins when a process
 * prints more than one.
 */
export function parseBunCoverageRow(output: string): PackageCoverage | null {
  const allFilesLine = output
    .split("\n")
    .reverse()
    .find((l) => /^\s*All files\s*\|/.test(l));
  if (!allFilesLine) return null;
  const parts = allFilesLine.split("|").map((p) => p.trim());
  const functions = Number(parts[1]);
  const lines = Number(parts[2]);
  if (Number.isNaN(functions) || Number.isNaN(lines)) return null;
  return { functions, lines };
}

/**
 * Mean of per-file "All files" rows, rounded to one decimal place.
 *
 * The isolated runners spawn one `bun test` process per file, so each file
 * reports its own "All files" row; we average them for the suite figure.
 */
export function meanCoverage(rows: PackageCoverage[]): PackageCoverage {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    functions: Math.round(avg(rows.map((r) => r.functions)) * 10) / 10,
    lines: Math.round(avg(rows.map((r) => r.lines)) * 10) / 10,
  };
}

/** Write a single-package coverage slice to `outPath`. */
export function writeCoverageSlice(pkg: string, coverage: PackageCoverage, outPath: string): void {
  writeFileSync(outPath, JSON.stringify({ [pkg]: coverage }, null, 2) + "\n");
}

/**
 * Merge multiple slice files into one `{ pkg: coverage }` object. Missing
 * files are skipped so a partial gate run still reports what it has.
 */
export function mergeCoverageSlices(paths: string[]): Record<string, PackageCoverage> {
  const merged: Record<string, PackageCoverage> = {};
  for (const p of paths) {
    if (!existsSync(p)) {
      console.warn(`⚠ coverage slice not found, skipping: ${p}`);
      continue;
    }
    const obj = JSON.parse(readFileSync(p, "utf8")) as Record<string, PackageCoverage>;
    Object.assign(merged, obj);
  }
  return merged;
}
