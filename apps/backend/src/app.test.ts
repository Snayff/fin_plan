import { describe, it, expect } from "bun:test";
import { join } from "path";
import { buildApp } from "./app";

describe("legacy setup-session removal", () => {
  it("does not have a setup-session service file", async () => {
    const fs = await import("fs");
    const servicePath = join(import.meta.dir, "services", "setup-session.service.ts");
    expect(fs.existsSync(servicePath)).toBe(false);
  });
});

describe("legacy setup-session route removal", () => {
  it("returns 404 for /api/setup-session", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/setup-session" });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
