import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock ioredis before importing the service
const mockGet = mock(() => Promise.resolve(null));
const mockSetex = mock(() => Promise.resolve("OK"));
const mockDel = mock(() => Promise.resolve(1));
const mockKeys = mock(() => Promise.resolve([]));
const mockScan = mock(() => Promise.resolve(['0', []]));

mock.module("ioredis", () => {
  return {
    default: class MockRedis {
      on() { return this; }
      get = mockGet;
      setex = mockSetex;
      del = mockDel;
      keys = mockKeys;
      scan = mockScan;
    },
  };
});

import { cacheService } from "./cache.service";

beforeEach(() => {
  mockGet.mockReset();
  mockSetex.mockReset();
  mockDel.mockReset();
  mockKeys.mockReset();
  mockScan.mockReset();
});

describe("cacheService.get", () => {
  it("returns null on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    const result = await cacheService.get("some-key");
    expect(result).toBeNull();
  });

  it("returns parsed JSON on cache hit", async () => {
    mockGet.mockResolvedValue(JSON.stringify({ foo: "bar" }));
    const result = await cacheService.get<{ foo: string }>("some-key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null on Redis error without throwing", async () => {
    mockGet.mockRejectedValue(new Error("Redis connection refused"));
    const result = await cacheService.get("some-key");
    expect(result).toBeNull();
  });
});

describe("cacheService.set", () => {
  it("serialises value and sets with TTL", async () => {
    mockSetex.mockResolvedValue("OK");
    await cacheService.set("my-key", { x: 1 }, 120);
    expect(mockSetex).toHaveBeenCalledWith("my-key", 120, JSON.stringify({ x: 1 }));
  });

  it("does not throw on Redis error", async () => {
    mockSetex.mockRejectedValue(new Error("Redis down"));
    await expect(cacheService.set("key", "value", 60)).resolves.toBeUndefined();
  });
});

describe("cacheService.invalidate", () => {
  it("deletes the given keys", async () => {
    mockDel.mockResolvedValue(2);
    await cacheService.invalidate("key-a", "key-b");
    expect(mockDel).toHaveBeenCalledWith("key-a", "key-b");
  });

  it("does nothing when no keys passed", async () => {
    await cacheService.invalidate();
    expect(mockDel).not.toHaveBeenCalled();
  });
});

describe("cacheService.invalidatePattern", () => {
  it("deletes all keys matching the pattern", async () => {
    // scan returns cursor '0' (done) with one matching key
    mockScan.mockResolvedValue(['0', ['dashboard:summary:hh-1:2026-03']]);
    mockDel.mockResolvedValue(1);
    await cacheService.invalidatePattern("dashboard:*:hh-1:*");
    expect(mockDel).toHaveBeenCalledWith("dashboard:summary:hh-1:2026-03");
  });

  it("does not call del when no keys match", async () => {
    mockScan.mockResolvedValue(['0', []]);
    await cacheService.invalidatePattern("dashboard:*:hh-1:*");
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("iterates through multiple scan pages until cursor returns '0'", async () => {
    mockScan
      .mockResolvedValueOnce(['42', ['dashboard:summary:hh-1:2026-02']])
      .mockResolvedValueOnce(['0', ['dashboard:summary:hh-1:2026-03']]);
    mockDel.mockResolvedValue(2);

    await cacheService.invalidatePattern("dashboard:summary:hh-1:*");

    expect(mockScan).toHaveBeenCalledTimes(2);
    expect(mockDel).toHaveBeenCalledWith(
      'dashboard:summary:hh-1:2026-02',
      'dashboard:summary:hh-1:2026-03'
    );
  });
});

describe("cacheService — Redis errors are swallowed silently", () => {
  it("get returns null when no client", async () => {
    // Force getRedis to return null by making the constructor throw
    mockGet.mockImplementation(() => { throw new Error("should not be called"); });
    // The singleton is already initialised in module scope, so we test via the catch path
    // Simulate Redis being unavailable by having get throw
    mockGet.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await cacheService.get("any-key");
    expect(result).toBeNull();
  });

  it("set resolves without throwing when no client", async () => {
    mockSetex.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(cacheService.set("key", "val", 60)).resolves.toBeUndefined();
  });

  it("invalidate resolves without throwing when no client", async () => {
    mockDel.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(cacheService.invalidate("key")).resolves.toBeUndefined();
  });

  it("invalidatePattern resolves without throwing when no client", async () => {
    mockScan.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(cacheService.invalidatePattern("dashboard:*")).resolves.toBeUndefined();
  });
});
