import { describe, it, expect } from "bun:test";
import { AuditAction, ResourceSlugEnum, AuditActionEnum } from "./audit.schemas";

describe("AuditAction", () => {
  it("exposes auth + household + summary actions as SCREAMING_SNAKE_CASE", () => {
    expect(AuditAction.LOGIN_SUCCESS).toBe("LOGIN_SUCCESS");
    expect(AuditAction.CREATE_INCOME_SOURCE).toBe("CREATE_INCOME_SOURCE");
    expect(AuditAction.DELETE_HOUSEHOLD).toBe("DELETE_HOUSEHOLD");
    expect(AuditAction.IMPORT_DATA).toBe("IMPORT_DATA");
    expect(AuditAction.UPDATE_PROFILE).toBe("UPDATE_PROFILE");
    expect(AuditAction.TOKEN_REFRESH).toBe("TOKEN_REFRESH");
  });

  it("every value matches its key (no drift between key and literal)", () => {
    for (const [k, v] of Object.entries(AuditAction)) {
      expect(v).toBe(k);
    }
  });

  it("AuditActionEnum accepts every AuditAction value", () => {
    for (const v of Object.values(AuditAction)) {
      expect(AuditActionEnum.safeParse(v).success).toBe(true);
    }
  });
});

describe("ResourceSlugEnum", () => {
  it("includes the new slugs required by richer-audit-logging", () => {
    const required = [
      "snapshot",
      "user",
      "gift-person",
      "gift-event",
      "gift-allocation",
      "member-profile",
      "year-budget",
      "household",
    ];
    for (const s of required) {
      expect(ResourceSlugEnum.safeParse(s).success).toBe(true);
    }
  });
});
