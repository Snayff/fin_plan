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
  floor: Floor;
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
    for (const metric of METRICS) {
      if (cur[metric] < input.floor[metric]) {
        violations.push({
          kind: "floor",
          pkg,
          metric,
          current: cur[metric],
          floor: input.floor[metric],
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
