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

  for (const file of files) {
    const filePath = `${testDir}/${file}`;
    const proc = Bun.spawn(
      ["bun", "test", ...(coverage ? ["--coverage"] : []), "--preload", preload, filePath],
      { stdout: "inherit", stderr: "inherit", env: process.env }
    );

    const exitCode = await proc.exited;
    if (exitCode === 0) passed++;
    else {
      failed++;
      failures.push(filePath);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Test files: ${passed + failed} total, ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\nFailed files:`);
    for (const f of failures) console.log(`  - ${f}`);
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
