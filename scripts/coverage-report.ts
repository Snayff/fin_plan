/**
 * True whole-codebase coverage reporter.
 *
 * The isolated test runners spawn one `bun test` process per file, so Bun's
 * built-in "All files" summary only ever reflects the handful of modules a
 * single test touched. Averaging those rows (the old per-file-mean) badly
 * understates real coverage — a file exercised by ten tests still shows up in
 * each of their narrow summaries.
 *
 * This tool instead runs each test file in isolation emitting an lcov report,
 * then MERGES the reports per source file (max line hit-count, max functions
 * hit) to recover the real percentage of the codebase that is exercised.
 *
 * Usage:
 *   bun scripts/coverage-report.ts <pkg-key> <pkg-dir> [--out <slice.json>] [--table]
 *
 * Example:
 *   bun scripts/coverage-report.ts apps/frontend apps/frontend --out coverage-current.json
 */

import { Glob } from "bun";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

interface FileCov {
  /** lineNo -> max hit count seen across reports */
  lines: Map<number, number>;
  /** total functions found (FNF) */
  fnFound: number;
  /** max functions hit (FNH) across reports */
  fnHit: number;
}

/** Source files excluded from the coverage denominator (tests + helpers + generated). */
function isIncludedSource(sf: string): boolean {
  // lcov SF paths are relative to the package dir; own source starts with "src/".
  // Anything via "../" is a cross-package import and belongs to that package's own tally.
  if (!sf.startsWith("src/")) return false;
  if (!/\.(ts|tsx)$/.test(sf)) return false;
  if (/\.test\.(ts|tsx)$/.test(sf)) return false;
  if (/\.d\.ts$/.test(sf)) return false;
  if (sf.includes("/test/") || sf.startsWith("test/")) return false;
  if (/(^|\/)scripts\//.test(sf)) return false;
  // backend seed/migration glue is not unit-testable
  if (/(^|\/)db\/seed\.ts$/.test(sf)) return false;
  if (/(^|\/)prisma\//.test(sf)) return false;
  return true;
}

/** Parse a single lcov.info into per-file coverage, merging into `acc`. */
function mergeLcov(text: string, acc: Map<string, FileCov>): void {
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

interface Totals {
  lineFound: number;
  lineHit: number;
  fnFound: number;
  fnHit: number;
  perFile: Array<{ sf: string; linePct: number; fnPct: number; lh: number; lf: number }>;
}

function tally(acc: Map<string, FileCov>): Totals {
  let lineFound = 0;
  let lineHit = 0;
  let fnFound = 0;
  let fnHit = 0;
  const perFile: Totals["perFile"] = [];
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
    perFile.push({
      sf,
      lf,
      lh,
      linePct: lf ? (100 * lh) / lf : 100,
      fnPct: cov.fnFound ? (100 * cov.fnHit) / cov.fnFound : 100,
    });
  }
  return { lineFound, lineHit, fnFound, fnHit, perFile };
}

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

const absPkg = resolve(pkgDir);
const testGlob = new Glob("**/*.test.{ts,tsx}");
const testFiles = Array.from(testGlob.scanSync(join(absPkg, "src"))).sort();

if (testFiles.length === 0) {
  console.error(`no test files found under ${absPkg}/src`);
  process.exit(1);
}

const preloadPath = join(absPkg, "src/test/setup.ts");
const preloadArgs = existsSync(preloadPath) ? ["--preload", preloadPath] : [];
const tmpRoot = mkdtempSync(join(tmpdir(), "cov-"));
const acc = new Map<string, FileCov>();

console.log(`Measuring true coverage for ${pkgKey} — ${testFiles.length} isolated runs...`);

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
  await proc.exited;
  try {
    mergeLcov(readFileSync(join(dir, "lcov.info"), "utf8"), acc);
  } catch {
    // a file that produced no lcov (e.g. all tests errored) contributes nothing
  }
  if (i % 25 === 0) process.stdout.write(`  ...${i}/${testFiles.length}\n`);
}

const t = tally(acc);
const linePct = t.lineFound ? Math.round((1000 * t.lineHit) / t.lineFound) / 10 : 0;
const fnPct = t.fnFound ? Math.round((1000 * t.fnHit) / t.fnFound) / 10 : 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`${pkgKey} TRUE whole-codebase coverage (${acc.size} files instrumented):`);
console.log(`  lines:     ${linePct}%  (${t.lineHit}/${t.lineFound})`);
console.log(`  functions: ${fnPct}%  (${t.fnHit}/${t.fnFound})`);

if (showTable) {
  console.log(`\nLowest-covered source files (by line %):`);
  t.perFile
    .sort((a, b) => a.linePct - b.linePct)
    .slice(0, 30)
    .forEach((f) => {
      console.log(`  ${f.linePct.toFixed(0).padStart(3)}%  ${f.lh}/${f.lf}  ${f.sf}`);
    });
}

if (outPath) {
  writeFileSync(
    outPath,
    JSON.stringify({ [pkgKey]: { functions: fnPct, lines: linePct } }, null, 2) + "\n"
  );
  console.log(`\nwrote ${outPath}`);
}
