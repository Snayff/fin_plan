/**
 * Test data factory functions.
 * Each call returns fresh data that can be customized via overrides.
 */

let counter = 0;

function nextId() {
  counter++;
  return `00000000-0000-0000-0000-${String(counter).padStart(12, "0")}`;
}

/** Reset the counter between test suites if needed */
export function resetFixtureCounter() {
  counter = 0;
}

export function buildUser(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    email: `user-${id}@test.com`,
    passwordHash: "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012",
    name: `Test User`,
    preferences: {
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      theme: "light",
      defaultInflationRate: 2.5,
    },
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildHousehold(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    name: "Test Household",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildHouseholdMember(overrides: Record<string, any> = {}) {
  return {
    householdId: "household-1",
    userId: "user-1",
    role: "owner" as const,
    joinedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildMember(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    userId: "user-1",
    name: "Test User",
    role: "owner" as const,
    dateOfBirth: null,
    retirementYear: null,
    joinedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildHouseholdInvite(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    email: null,
    tokenHash: "a".repeat(64),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedAt: null,
    createdByUserId: "user-1",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildSubcategory(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    tier: "committed" as const,
    name: "Other",
    sortOrder: 0,
    isLocked: false,
    isDefault: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildCommittedItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    subcategoryId: "sub-other-committed",
    name: "Test Bill",
    amount: 100,
    spendType: "monthly" as const,
    notes: null,
    ownerId: null,
    dueMonth: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildDiscretionaryItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    subcategoryId: "sub-other-disc",
    name: "Test Category",
    amount: 100,
    spendType: "monthly" as const,
    notes: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
