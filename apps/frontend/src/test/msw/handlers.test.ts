// apps/frontend/src/test/msw/handlers.test.ts
//
// Validates that hand-written MSW mock fixtures conform to the shared response
// Zod schemas (.strict() mode) and never leak sensitive fields.

import { describe, it, expect } from "bun:test";
import {
  mockUser,
  mockAccount,
  mockTransaction,
  mockGoal,
  mockEnhancedGoal,
  mockLiability,
  mockAsset,
  mockEnhancedAsset,
  mockRecurringRule,
} from "./handlers";
import {
  // Auth
  userResponseSchema,
  authLoginResponseSchema,
  authMeResponseSchema,
  authRefreshResponseSchema,
  csrfTokenResponseSchema,
  // Household
  householdListResponseSchema,
  householdResponseSchema,
  householdDetailResponseSchema,
  // Invite
  inviteCreateResponseSchema,
  inviteDetailResponseSchema,
  inviteAcceptResponseSchema,
  // Generic
  successResponseSchema,
  messageResponseSchema,
} from "@finplan/shared";

// ─── Individual fixture validation ─────────────────────────────────────────

describe("MSW fixture contract validation", () => {
  describe("Auth fixtures", () => {
    it("mockUser conforms to userResponseSchema", () => {
      const result = userResponseSchema.safeParse(mockUser);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });

  // TODO: add response schema for accounts
  // TODO: add response schema for transactions
  // TODO: add response schema for goals
  // TODO: add response schema for liabilities
  // TODO: add response schema for assets
  // TODO: add response schema for recurring rules
});

// ─── Full response wrapper validation ──────────────────────────────────────

describe("MSW response wrapper validation", () => {
  describe("Auth response wrappers", () => {
    it("login response conforms to authLoginResponseSchema", () => {
      const loginResponse = {
        user: mockUser,
        accessToken: "test-token",
        refreshToken: "refresh-token",
      };
      const result = authLoginResponseSchema.safeParse(loginResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("me response conforms to authMeResponseSchema", () => {
      const meResponse = { user: mockUser };
      const result = authMeResponseSchema.safeParse(meResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("refresh response conforms to authRefreshResponseSchema", () => {
      const refreshResponse = { accessToken: "new-access-token" };
      const result = authRefreshResponseSchema.safeParse(refreshResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("CSRF response conforms to csrfTokenResponseSchema", () => {
      const csrfResponse = { csrfToken: "test-csrf-token" };
      const result = csrfTokenResponseSchema.safeParse(csrfResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });

  describe("Household response wrappers", () => {
    it("household list response conforms to householdListResponseSchema", () => {
      const listResponse = {
        households: [
          {
            householdId: "household-1",
            userId: "user-1",
            role: "owner",
            joinedAt: "2025-01-01T00:00:00Z",
            household: {
              id: "household-1",
              name: "My Household",
              createdAt: "2025-01-01T00:00:00Z",
              updatedAt: "2025-01-01T00:00:00Z",
              _count: { members: 1 },
            },
          },
        ],
      };
      const result = householdListResponseSchema.safeParse(listResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("household create response conforms to householdResponseSchema", () => {
      const createResponse = {
        household: {
          id: "household-1",
          name: "My Household",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      };
      const result = householdResponseSchema.safeParse(createResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("household detail response conforms to householdDetailResponseSchema", () => {
      const detailResponse = {
        household: {
          id: "household-1",
          name: "My Household",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          members: [],
          invites: [],
        },
      };
      const result = householdDetailResponseSchema.safeParse(detailResponse);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });

  describe("Invite response wrappers", () => {
    it("invite create response conforms to inviteCreateResponseSchema", () => {
      const response = {
        token: "mock-invite-token",
        invitedEmail: "invitee@example.com",
      };
      const result = inviteCreateResponseSchema.safeParse(response);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("invite detail response conforms to inviteDetailResponseSchema", () => {
      const response = {
        householdId: "household-1",
        householdName: "My Household",
        emailRequired: true,
        maskedInvitedEmail: "i******@example.com",
      };
      const result = inviteDetailResponseSchema.safeParse(response);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("invite accept response conforms to inviteAcceptResponseSchema", () => {
      const response = {
        user: mockUser,
        accessToken: "test-token",
      };
      const result = inviteAcceptResponseSchema.safeParse(response);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });

  describe("Generic response wrappers", () => {
    it("success response conforms to successResponseSchema", () => {
      const response = { success: true as const };
      const result = successResponseSchema.safeParse(response);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });

    it("message response conforms to messageResponseSchema", () => {
      const response = { message: "Account deleted successfully" };
      const result = messageResponseSchema.safeParse(response);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });
});

// ─── Security: sensitive field exclusion ───────────────────────────────────

describe("Security: no sensitive fields in response mocks", () => {
  const sensitiveFields = [
    "passwordHash",
    "twoFactorSecret",
    "twoFactorEnabled",
    "twoFactorBackupCodes",
    "tokenHash",
  ];

  const allMocks = [
    { name: "mockUser", value: mockUser },
    { name: "mockAccount", value: mockAccount },
    { name: "mockTransaction", value: mockTransaction },
    { name: "mockGoal", value: mockGoal },
    { name: "mockEnhancedGoal", value: mockEnhancedGoal },
    { name: "mockLiability", value: mockLiability },
    { name: "mockAsset", value: mockAsset },
    { name: "mockEnhancedAsset", value: mockEnhancedAsset },
    { name: "mockRecurringRule", value: mockRecurringRule },
  ];

  for (const { name, value } of allMocks) {
    it(`${name} does not contain sensitive fields`, () => {
      for (const field of sensitiveFields) {
        expect(value).not.toHaveProperty(field);
      }
    });
  }
});
