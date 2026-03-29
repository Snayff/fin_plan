import { describe, it, expect } from "bun:test";
import {
  HouseholdRoleEnum,
  ResourceSlugEnum,
  AuditChangeSchema,
  AuditEntrySchema,
  AuditLogQuerySchema,
} from "./audit.schemas";
import { updateMemberRoleSchema } from "./household.schemas";

describe("HouseholdRoleEnum", () => {
  it("accepts owner, admin, member", () => {
    expect(HouseholdRoleEnum.parse("owner")).toBe("owner");
    expect(HouseholdRoleEnum.parse("admin")).toBe("admin");
    expect(HouseholdRoleEnum.parse("member")).toBe("member");
  });
  it("rejects unknown values", () => {
    expect(() => HouseholdRoleEnum.parse("superuser")).toThrow();
  });
});

describe("AuditChangeSchema", () => {
  it("accepts update entry", () => {
    const result = AuditChangeSchema.parse({
      field: "amount",
      before: 100,
      after: 200,
    });
    expect(result.field).toBe("amount");
  });
  it("accepts create entry (no before)", () => {
    const result = AuditChangeSchema.parse({ field: "name", after: "Salary" });
    expect(result.before).toBeUndefined();
  });
});

describe("AuditLogQuerySchema", () => {
  it("applies defaults", () => {
    const result = AuditLogQuerySchema.parse({});
    expect(result.limit).toBe(50);
    expect(result.cursor).toBeUndefined();
  });
  it("accepts all filters", () => {
    const result = AuditLogQuerySchema.parse({
      actorId: "user_1",
      resource: "income-source",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-01",
      cursor: "abc123",
      limit: 20,
    });
    expect(result.resource).toBe("income-source");
  });
});

describe("updateMemberRoleSchema", () => {
  it("accepts valid update", () => {
    const result = updateMemberRoleSchema.parse({
      targetUserId: "u1",
      role: "admin",
    });
    expect(result.role).toBe("admin");
  });
  it("rejects owner role assignment", () => {
    expect(() => updateMemberRoleSchema.parse({ targetUserId: "u1", role: "owner" })).toThrow();
  });
});
