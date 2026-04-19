import { describe, it, expect, mock } from "bun:test";

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
