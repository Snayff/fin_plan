import { describe, it, expect } from "bun:test";
import { existsSync } from "fs";
import { join } from "path";

describe("legacy setup-session client removal", () => {
  it("does not have a setup-session service file", () => {
    const filePath = join(import.meta.dir, "setup-session.service.ts");
    expect(existsSync(filePath)).toBe(false);
  });
});
