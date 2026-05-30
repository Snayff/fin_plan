import path from "path";

/**
 * Monorepo-aware lint-staged config.
 *
 * ESLint v9 flat config files live per-workspace (apps/backend, apps/frontend).
 * Running `eslint` from the repo root fails because there is no root-level
 * eslint.config.js. This function groups staged files by their nearest workspace
 * and passes `--config <workspace>/eslint.config.js` so ESLint finds the right
 * flat config regardless of CWD.
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

  return Object.entries(byWorkspace).map(([ws, files]) => {
    const configPath = path.resolve(process.cwd(), ws, "eslint.config.js").replace(/\\/g, "/");
    const fileList = files.map((f) => `"${f.replace(/\\/g, "/")}"`).join(" ");
    return `eslint --fix --max-warnings=0 --no-warn-ignored --config ${configPath} ${fileList}`;
  });
};
