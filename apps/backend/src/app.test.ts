import { describe, it, expect, mock } from "bun:test";
import { join } from "path";

// Mock retention before importing app
const startRetentionJobMock = mock(() => {});
mock.module("./services/retention.service", () => ({
  startRetentionJob: startRetentionJobMock,
  RETENTION_DAYS: 180,
  purgeOldAuditLogs: mock(async () => 0),
}));

const { buildApp } = await import("./app");

describe("buildApp retention wiring", () => {
  it("calls startRetentionJob on app build", async () => {
    await buildApp({ logger: false });
    expect(startRetentionJobMock).toHaveBeenCalledTimes(1);
  });
});

describe("legacy setup-session removal", () => {
  it("does not have a setup-session service file", async () => {
    const fs = await import("fs");
    const servicePath = join(import.meta.dir, "services", "setup-session.service.ts");
    expect(fs.existsSync(servicePath)).toBe(false);
  });

  it("returns 404 for /api/setup-session", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/setup-session" });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
