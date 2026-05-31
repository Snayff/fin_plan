import { describe, it, expect, beforeEach, mock } from "bun:test";

/**
 * Endpoint-contract tests for the thin apiClient wrappers in householdService.
 * These guard against URL/verb/payload typos. The MSW-backed behavioural tests
 * live in household.service.test.ts.
 */
const apiClientMock = {
  get: mock(() => Promise.resolve({} as any)),
  post: mock(() => Promise.resolve({} as any)),
  put: mock(() => Promise.resolve({} as any)),
  patch: mock(() => Promise.resolve({} as any)),
  delete: mock(() => Promise.resolve({} as any)),
};
mock.module("@/lib/api", () => ({ apiClient: apiClientMock }));

const { householdService } = await import("./household.service");

beforeEach(() => {
  for (const fn of Object.values(apiClientMock)) fn?.mockClear?.();
});

describe("householdService endpoint contracts", () => {
  it("getHouseholdDetails GETs the household", async () => {
    await householdService.getHouseholdDetails("h1");
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/households/h1");
  });

  it("renameHousehold PATCHes the name", async () => {
    await householdService.renameHousehold("h1", "New Name");
    expect(apiClientMock.patch).toHaveBeenCalledWith("/api/households/h1", { name: "New Name" });
  });

  it("inviteMember POSTs the email without a role by default", async () => {
    await householdService.inviteMember("h1", "a@b.com");
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/households/h1/invite", {
      email: "a@b.com",
    });
  });

  it("inviteMember includes the role when provided", async () => {
    await householdService.inviteMember("h1", "a@b.com", "admin");
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/households/h1/invite", {
      email: "a@b.com",
      role: "admin",
    });
  });

  it("regenerateInvite cancels the old invite then re-invites", async () => {
    await householdService.regenerateInvite("h1", "inv1", "a@b.com");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/households/h1/invites/inv1");
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/households/h1/invite", {
      email: "a@b.com",
    });
  });

  it("removeMember DELETEs the member", async () => {
    await householdService.removeMember("h1", "m1");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/households/h1/members/m1");
  });

  it("cancelInvite DELETEs the invite", async () => {
    await householdService.cancelInvite("h1", "inv1");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/households/h1/invites/inv1");
  });

  it("leaveHousehold DELETEs the leave endpoint", async () => {
    await householdService.leaveHousehold("h1");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/households/h1/leave");
  });

  it("deleteHousehold DELETEs the household", async () => {
    await householdService.deleteHousehold("h1");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/households/h1");
  });

  it("acceptInvite POSTs the registration data to the accept endpoint", async () => {
    const data = { name: "Ada", email: "ada@b.com", password: "longenoughpassword" };
    await householdService.acceptInvite("tok", data);
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/auth/invite/tok/accept", data);
  });

  it("joinViaInvite POSTs to the join endpoint", async () => {
    await householdService.joinViaInvite("tok");
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/auth/invite/tok/join");
  });

  it("listMembers GETs member profiles", async () => {
    await householdService.listMembers("h1");
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/households/h1/member-profiles");
  });

  it("createMember POSTs the new member", async () => {
    await householdService.createMember("h1", { name: "Bob" });
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/households/h1/member-profiles", {
      name: "Bob",
    });
  });

  it("updateMember PATCHes the member", async () => {
    await householdService.updateMember("h1", "m1", { name: "Bobby" });
    expect(apiClientMock.patch).toHaveBeenCalledWith("/api/households/h1/member-profiles/m1", {
      name: "Bobby",
    });
  });

  it("deleteMember DELETEs without a body when no reassignment", async () => {
    await householdService.deleteMember("h1", "m1");
    expect(apiClientMock.delete).toHaveBeenCalledWith(
      "/api/households/h1/member-profiles/m1",
      undefined
    );
  });

  it("deleteMember passes the reassignment target when given", async () => {
    await householdService.deleteMember("h1", "m1", "m2");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/households/h1/member-profiles/m1", {
      reassignToMemberId: "m2",
    });
  });

  it("exportHousehold GETs the export endpoint", async () => {
    await householdService.exportHousehold();
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/households/export");
  });

  it("validateImport POSTs the data", async () => {
    await householdService.validateImport({ schemaVersion: 2 });
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/households/validate-import", {
      schemaVersion: 2,
    });
  });

  it("importHousehold POSTs with the mode query param", async () => {
    await householdService.importHousehold({ x: 1 }, "overwrite");
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/households/import?mode=overwrite", {
      x: 1,
    });
  });
});
