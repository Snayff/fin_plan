import { describe, it, expect } from "bun:test";
import type { FastifyRequest } from "fastify";
import { actorCtx } from "./actor-ctx";
import { AuthenticationError } from "../utils/errors";

/**
 * Build a minimal FastifyRequest-shaped object for actorCtx, which only reads
 * `user`, `householdId`, `ip`, and `headers["user-agent"]`.
 */
function makeReq(overrides: Partial<FastifyRequest>): FastifyRequest {
  return {
    user: { userId: "user-1", name: "Ada Lovelace" },
    householdId: "hh-1",
    ip: "203.0.113.7",
    headers: { "user-agent": "vitest/1.0" },
    ...overrides,
  } as unknown as FastifyRequest;
}

describe("actorCtx", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────
  it("maps an authenticated request to a full ActorCtx", () => {
    const ctx = actorCtx(makeReq({}));

    expect(ctx).toEqual({
      householdId: "hh-1",
      actorId: "user-1",
      actorName: "Ada Lovelace",
      ipAddress: "203.0.113.7",
      userAgent: "vitest/1.0",
    });
  });

  it("passes through a missing user-agent as undefined", () => {
    const ctx = actorCtx(makeReq({ headers: {} as FastifyRequest["headers"] }));

    expect(ctx.userAgent).toBeUndefined();
    expect(ctx.ipAddress).toBe("203.0.113.7");
  });

  // ── Unhappy path ────────────────────────────────────────────────────────────
  it("throws AuthenticationError when user is absent", () => {
    expect(() => actorCtx(makeReq({ user: undefined }))).toThrow(AuthenticationError);
  });

  it("throws AuthenticationError when householdId is absent", () => {
    expect(() => actorCtx(makeReq({ householdId: undefined }))).toThrow(AuthenticationError);
  });

  it("error message points at missing auth middleware", () => {
    expect(() => actorCtx(makeReq({ user: undefined }))).toThrow(/authMiddleware runs first/);
  });
});
