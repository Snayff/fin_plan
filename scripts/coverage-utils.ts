import { existsSync, readFileSync, writeFileSync } from "node:fs";

/**
 * Shared helpers for producing and combining coverage slices.
 *
 * Each test suite (backend, frontend, shared) emits a single-package "slice"
 * — `{ "<pkg>": { functions, lines } }` — written to `coverage-current.json`.
 * In CI each suite runs in its own job, uploads its slice as an artefact, and
 * the coverage-gate job merges them back into one object for `check-coverage`.
 *
 * Coverage is measured as TRUE whole-codebase coverage: the isolated runners
 * spawn one `bun test` process per file emitting an lcov report, and we merge
 * those reports per source file (max hit-count per line, max functions-hit per
 * file). This recovers the real percentage of the codebase that is exercised —
 * unlike averaging each run's narrow "All files" row, which only ever reflects
 * the handful of modules a single test touched.
 */

export interface PackageCoverage {
  functions: number;
  lines: number;
}

// ─── lcov merge (true whole-codebase coverage) ───────────────────────────────

interface FileCov {
  /** lineNo -> max hit count seen across reports */
  lines: Map<number, number>;
  /** total functions found (FNF) */
  fnFound: number;
  /** max functions hit (FNH) across reports */
  fnHit: number;
}

/** Accumulator mapping an lcov SF path to its merged coverage. */
export type LcovAccumulator = Map<string, FileCov>;

export function newLcovAccumulator(): LcovAccumulator {
  return new Map();
}

/**
 * Source files counted in the coverage denominator. lcov SF paths are relative
 * to the package dir, so own source starts with "src/". Excludes tests, test
 * helpers, generated/declaration files, and non-unit-testable glue.
 */
export function isIncludedSource(sf: string): boolean {
  if (!sf.startsWith("src/")) return false; // "../" → another package's tally
  if (!/\.(ts|tsx)$/.test(sf)) return false;
  if (/\.test\.(ts|tsx)$/.test(sf)) return false;
  if (/\.d\.ts$/.test(sf)) return false;
  if (sf.includes("/test/")) return false;
  if (/(^|\/)db\/seed\.ts$/.test(sf)) return false;
  if (/(^|\/)server\.ts$/.test(sf)) return false; // bootstrap entrypoint
  return true;
}

/** Parse a single lcov.info into per-file coverage, merging into `acc`. */
export function mergeLcov(text: string, acc: LcovAccumulator): void {
  let cur: FileCov | null = null;
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (l.startsWith("SF:")) {
      const sf = l.slice(3);
      cur = acc.get(sf) ?? { lines: new Map(), fnFound: 0, fnHit: 0 };
      acc.set(sf, cur);
    } else if (!cur) {
      continue;
    } else if (l.startsWith("DA:")) {
      const [ln, hit] = l.slice(3).split(",").map(Number);
      if (ln !== undefined && hit !== undefined) {
        cur.lines.set(ln, Math.max(cur.lines.get(ln) ?? 0, hit));
      }
    } else if (l.startsWith("FNF:")) {
      cur.fnFound = Math.max(cur.fnFound, Number(l.slice(4)));
    } else if (l.startsWith("FNH:")) {
      cur.fnHit = Math.max(cur.fnHit, Number(l.slice(4)));
    } else if (l === "end_of_record") {
      cur = null;
    }
  }
}

export interface CoverageTotals extends PackageCoverage {
  lineFound: number;
  lineHit: number;
  fnFound: number;
  fnHit: number;
  /** Per-source-file breakdown, for the gap-finder table. */
  perFile: Array<{ sf: string; linePct: number; lh: number; lf: number }>;
}

/** Tally a merged accumulator into rounded line/function percentages. */
export function tallyLcov(acc: LcovAccumulator): CoverageTotals {
  let lineFound = 0;
  let lineHit = 0;
  let fnFound = 0;
  let fnHit = 0;
  const perFile: CoverageTotals["perFile"] = [];
  for (const [sf, cov] of acc) {
    if (!isIncludedSource(sf)) continue;
    let lf = 0;
    let lh = 0;
    for (const [, hit] of cov.lines) {
      lf++;
      if (hit > 0) lh++;
    }
    lineFound += lf;
    lineHit += lh;
    fnFound += cov.fnFound;
    fnHit += cov.fnHit;
    perFile.push({ sf, lf, lh, linePct: lf ? (100 * lh) / lf : 100 });
  }
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    lineFound,
    lineHit,
    fnFound,
    fnHit,
    lines: lineFound ? round((100 * lineHit) / lineFound) : 0,
    functions: fnFound ? round((100 * fnHit) / fnFound) : 0,
    perFile,
  };
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
