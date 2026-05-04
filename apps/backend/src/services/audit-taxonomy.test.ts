import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AuditAction, ResourceSlugEnum } from "@finplan/shared";

const ROOT = join(import.meta.dir, "..");

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) yield full;
  }
}

const backendSources = [...walk(ROOT)];

describe("audit taxonomy — action names", () => {
  it('every `action: "…"` or `action: AuditAction.XXX` is a known AuditAction value', () => {
    const known = new Set(Object.values(AuditAction) as string[]);
    const stringLiteral = /action:\s*["'`]([A-Z_]+)["'`]/g;
    const bad: { file: string; action: string }[] = [];
    for (const file of backendSources) {
      const src = readFileSync(file, "utf8");
      let m: RegExpExecArray | null;
      while ((m = stringLiteral.exec(src))) {
        if (!known.has(m[1]!)) bad.push({ file, action: m[1]! });
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("audit taxonomy — resource slugs", () => {
  it('every `resource: "slug"` literal is a member of ResourceSlugEnum', () => {
    const known = new Set(ResourceSlugEnum.options as string[]);
    const stringLiteral = /resource:\s*["'`]([a-z-]+)["'`]/g;
    const bad: { file: string; slug: string }[] = [];
    for (const file of backendSources) {
      const src = readFileSync(file, "utf8");
      let m: RegExpExecArray | null;
      while ((m = stringLiteral.exec(src))) {
        if (!known.has(m[1]!)) bad.push({ file, slug: m[1]! });
      }
    }
    expect(bad).toEqual([]);
  });
});
