import { describe, it, expect } from "bun:test";
import { join } from "path";

describe("legacy setup-session removal", () => {
  it("does not have a setup-session service file", async () => {
    const fs = await import("fs");
    const servicePath = join(import.meta.dir, "services", "setup-session.service.ts");
    expect(fs.existsSync(servicePath)).toBe(false);
  });
});
