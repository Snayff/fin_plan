import { existsSync, readFileSync } from "node:fs";

export type Metric = "functions" | "lines";

export interface PackageCoverage {
  functions: number;
  lines: number;
}

export interface Floor {
  functions: number;
  lines: number;
}

export type Violation =
  | { kind: "floor"; pkg: string; metric: Metric; current: number; floor: number }
  | {
      kind: "ratchet";
      pkg: string;
      metric: Metric;
      current: number;
      baseline: number;
      dropPp: number;
    }
  | { kind: "missing-baseline"; pkg: string };

export interface EvaluateInput {
  current: Record<string, PackageCoverage>;
  baseline: Record<string, PackageCoverage>;
  /** Default floor applied to any package without a `floors` override. */
  floor: Floor;
  /** Optional per-package floor overrides, keyed by package path. */
  floors?: Record<string, Floor>;
  ratchetTolerancePp: number;
}

export interface EvaluateResult {
  ok: boolean;
  violations: Violation[];
}

const METRICS: Metric[] = ["functions", "lines"];

export function evaluateCoverage(input: EvaluateInput): EvaluateResult {
  const violations: Violation[] = [];

  for (const [pkg, cur] of Object.entries(input.current)) {
    const floor = input.floors?.[pkg] ?? input.floor;
    for (const metric of METRICS) {
      if (cur[metric] < floor[metric]) {
        violations.push({
          kind: "floor",
          pkg,
          metric,
          current: cur[metric],
          floor: floor[metric],
        });
      }
    }

    const base = input.baseline[pkg];
    if (!base) {
      violations.push({ kind: "missing-baseline", pkg });
      continue;
    }

    for (const metric of METRICS) {
      const dropPp = base[metric] - cur[metric];
      if (dropPp > input.ratchetTolerancePp) {
        violations.push({
          kind: "ratchet",
          pkg,
          metric,
          current: cur[metric],
          baseline: base[metric],
          dropPp,
        });
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

interface RunOptions {
  baselinePath: string;
  currentPath: string;
  floor: Floor;
  floors?: Record<string, Floor>;
  ratchetTolerancePp: number;
  /** Coverage goal each package is ratcheting toward. Reported, not enforced. */
  target?: Floor;
}

/** Print per-package distance to the target. Informational — never fails CI. */
export function reportProgress(current: Record<string, PackageCoverage>, target: Floor): void {
  console.log(
    `\nProgress toward target (functions ≥ ${target.functions}%, lines ≥ ${target.lines}%):`
  );
  for (const [pkg, cur] of Object.entries(current)) {
    const fnGap = target.functions - cur.functions;
    const lineGap = target.lines - cur.lines;
    const mark = (gap: number) => (gap <= 0 ? "✅" : `▲ ${gap.toFixed(1)}pp`);
    console.log(
      `  ${pkg}: functions ${cur.functions.toFixed(1)}% ${mark(fnGap)}, lines ${cur.lines.toFixed(1)}% ${mark(lineGap)}`
    );
  }
}

export function runCli(opts: RunOptions): number {
  if (!existsSync(opts.baselinePath)) {
    console.error(`coverage-baseline file not found: ${opts.baselinePath}`);
    return 1;
  }
  if (!existsSync(opts.currentPath)) {
    console.error(`current coverage file not found: ${opts.currentPath}`);
    return 1;
  }

  const baseline = JSON.parse(readFileSync(opts.baselinePath, "utf8")) as Record<
    string,
    PackageCoverage
  >;
  const current = JSON.parse(readFileSync(opts.currentPath, "utf8")) as Record<
    string,
    PackageCoverage
  >;

  const { ok, violations } = evaluateCoverage({
    current,
    baseline,
    floor: opts.floor,
    floors: opts.floors,
    ratchetTolerancePp: opts.ratchetTolerancePp,
  });

  if (opts.target) reportProgress(current, opts.target);

  if (ok) {
    console.log("✅ coverage check passed");
    return 0;
  }

  console.error("❌ coverage check failed:");
  for (const v of violations) {
    if (v.kind === "floor") {
      console.error(`  [${v.pkg}] ${v.metric} ${v.current.toFixed(1)}% below floor ${v.floor}%`);
    } else if (v.kind === "ratchet") {
      console.error(
        `  [${v.pkg}] ${v.metric} dropped ${v.dropPp.toFixed(2)}pp (baseline ${v.baseline.toFixed(1)}% → current ${v.current.toFixed(1)}%)`
      );
    } else {
      console.error(
        `  [${v.pkg}] missing from coverage-baseline.json — add an entry or remove the package`
      );
    }
  }
  console.error(
    `\nIf this drop is intentional, update coverage-baseline.json in the same PR and reviewers will see it.`
  );
  return 1;
}

// Only execute CLI when invoked directly (not when imported by tests).
if (import.meta.main) {
  const exitCode = runCli({
    baselinePath: "coverage-baseline.json",
    currentPath: process.argv[2] ?? "coverage-current.json",
    // Floors are measured against TRUE whole-codebase coverage (merged lcov),
    // the same metric the slice emitters now report — so writing tests moves
    // these numbers, and "90%" means 90% of the code is really exercised.
    // Default floor — applied to any package without an explicit override below.
    floor: { functions: 63, lines: 70 },
    // Per-package floors. Each sits ~2pp below the package's current baseline;
    // the 1pp ratchet catches gradual erosion above the floor. As tests land,
    // run `bun scripts/bump-baseline.ts` to lock in the gains — this drags each
    // floor upward toward the 90% target below.
    floors: {
      "apps/backend": { functions: 85, lines: 72 },
      "apps/frontend": { functions: 53, lines: 70 },
      "packages/shared": { functions: 90, lines: 90 },
    },
    ratchetTolerancePp: 1,
    // The goal every package is climbing toward. Reported on each run; the gate
    // does not fail until a package's floor (raised via bump-baseline) reaches it.
    target: { functions: 90, lines: 90 },
  });
  process.exit(exitCode);
}
