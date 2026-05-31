import path from "path";

/**
 * Monorepo-aware lint-staged config.
 *
 * ESLint v9 flat config files live per-workspace (apps/backend, apps/frontend).
 * Two things matter here:
 *   1. There is no root-level eslint.config.js, so eslint must use each
 *      workspace's config.
 *   2. ESLint resolves a config's relative `files` globs (e.g. the
 *      `src/**\/*.ts` override that disables `no-explicit-any`) against the
 *      *current working directory*, not the config's directory. Running from
 *      the repo root with absolute paths makes those overrides silently miss,
 *      so test files get linted with the wrong ruleset and fail on rules CI
 *      (which runs from inside the workspace) allows.
 *
 * Both are fixed by `cd`-ing into the workspace and passing workspace-relative
 * paths — identical to how `bun run lint` and CI invoke eslint.
 */

// Only apps/backend and apps/frontend have flat ESLint configs and lint scripts;
// packages/shared is type-checked but not linted (CI's turbo lint skips it too),
// so staged shared files are intentionally left out and skipped by getWorkspace.
const WORKSPACES = ["apps/backend", "apps/frontend"];

/** Return the workspace root for a given absolute file path, or null. */
function getWorkspace(filePath) {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  return WORKSPACES.find((ws) => rel.startsWith(ws + "/")) ?? null;
}

export default (stagedFiles) => {
  /** @type {Record<string, string[]>} workspace -> [absolute file paths] */
  const byWorkspace = {};

  for (const file of stagedFiles) {
    const ws = getWorkspace(file);
    if (!ws) continue; // skip root-level config files
    if (!byWorkspace[ws]) byWorkspace[ws] = [];
    byWorkspace[ws].push(file);
  }

  const root = process.cwd();
  return Object.entries(byWorkspace).map(([ws, files]) => {
    // Paths relative to the workspace so eslint's `files` overrides resolve
    // correctly once we cd into it.
    const fileList = files
      .map((f) => `"${path.relative(path.join(root, ws), f).replace(/\\/g, "/")}"`)
      .join(" ");
    return `bash -c 'cd ${ws} && eslint --fix --max-warnings=0 --no-warn-ignored ${fileList}'`;
  });
};
