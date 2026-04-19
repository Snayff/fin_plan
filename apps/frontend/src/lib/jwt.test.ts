import { describe, it, expect } from "bun:test";
import { decodeAccessTokenExpMs } from "./jwt";

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeToken(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("decodeAccessTokenExpMs", () => {
  it("returns the exp claim in milliseconds", () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 900;
    const token = makeToken({ sub: "user-1", exp: expSeconds });

    expect(decodeAccessTokenExpMs(token)).toBe(expSeconds * 1000);
  });

  it("returns null when token has no exp claim", () => {
    const token = makeToken({ sub: "user-1" });
    expect(decodeAccessTokenExpMs(token)).toBeNull();
  });

  it("returns null when exp is not numeric", () => {
    const token = makeToken({ sub: "user-1", exp: "not-a-number" });
    expect(decodeAccessTokenExpMs(token)).toBeNull();
  });

  it("returns null when token is malformed (wrong segment count)", () => {
    expect(decodeAccessTokenExpMs("not.a.jwt.at.all")).toBeNull();
    expect(decodeAccessTokenExpMs("only-one-segment")).toBeNull();
  });

  it("returns null when payload is not valid base64url JSON", () => {
    expect(decodeAccessTokenExpMs("aaa.!!!.zzz")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(decodeAccessTokenExpMs("")).toBeNull();
  });

  it("decodes base64url-specific characters (-, _) without padding", () => {
    const expSeconds = 1700000000;
    const token = makeToken({ data: ">>>>???", exp: expSeconds });
    expect(decodeAccessTokenExpMs(token)).toBe(expSeconds * 1000);
  });
});
