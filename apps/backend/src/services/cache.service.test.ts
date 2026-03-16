import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock ioredis before importing the service
const mockGet = mock(() => Promise.resolve(null));
const mockSetex = mock(() => Promise.resolve("OK"));
const mockDel = mock(() => Promise.resolve(1));
const mockKeys = mock(() => Promise.resolve([]));

mock.module("ioredis", () => {
  return {
    default: class MockRedis {
      on() { return this; }
      get = mockGet;
      setex = mockSetex;
      del = mockDel;
      keys = mockKeys;
    },
  };
});

import { cacheService } from "./cache.service";

beforeEach(() => {
  mockGet.mockReset();
  mockSetex.mockReset();
  mockDel.mockReset();
  mockKeys.mockReset();
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
    mockKeys.mockResolvedValue(["dashboard:summary:hh-1:2026-03"]);
    mockDel.mockResolvedValue(1);
    await cacheService.invalidatePattern("dashboard:*:hh-1:*");
    expect(mockDel).toHaveBeenCalledWith("dashboard:summary:hh-1:2026-03");
  });

  it("does not call del when no keys match", async () => {
    mockKeys.mockResolvedValue([]);
    await cacheService.invalidatePattern("dashboard:*:hh-1:*");
    expect(mockDel).not.toHaveBeenCalled();
  });
});
