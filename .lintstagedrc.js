import { existsSync } from "fs";
import path from "path";

/**
 * Monorepo-aware lint-staged config.
 *
 * ESLint v9 flat config files live per-workspace (apps/backend, apps/frontend).
 * Running `eslint` from the repo root fails because there is no root-level
 * eslint.config.js. This function groups staged files by their nearest workspace
 * and passes `--config <workspace>/eslint.config.js` so ESLint finds the right
 * flat config regardless of CWD.
 *
 * Only JS/TS source files are linted, and only for workspaces that actually
 * have an eslint flat config. Without these guards, staging e.g.
 * `packages/shared/package.json` (a workspace with no eslint.config.js) made
 * ESLint abort with ENOENT and blocked the commit.
 */

const WORKSPACES = ["apps/backend", "apps/frontend", "packages/shared"];
const LINTABLE = /\.(?:js|jsx|ts|tsx|cjs|mjs)$/;

/** Return the workspace root for a given absolute file path, or null. */
function getWorkspace(filePath) {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  return WORKSPACES.find((ws) => rel.startsWith(ws + "/")) ?? null;
}

export default (stagedFiles) => {
  /** @type {Record<string, string[]>} workspace -> [absolute file paths] */
  const byWorkspace = {};

  for (const file of stagedFiles) {
    if (!LINTABLE.test(file)) continue; // only lint JS/TS sources
    const ws = getWorkspace(file);
    if (!ws) continue; // skip root-level files
    if (!byWorkspace[ws]) byWorkspace[ws] = [];
    byWorkspace[ws].push(file);
  }

  return Object.entries(byWorkspace).flatMap(([ws, files]) => {
    const configPath = path.resolve(process.cwd(), ws, "eslint.config.js").replace(/\\/g, "/");
    if (!existsSync(configPath)) return []; // workspace has no eslint config (e.g. packages/shared)
    const fileList = files.map((f) => `"${f.replace(/\\/g, "/")}"`).join(" ");
    return [`eslint --fix --max-warnings=0 --no-warn-ignored --config ${configPath} ${fileList}`];
  });
};
