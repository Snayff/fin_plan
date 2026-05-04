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
    memberId: null,
    dueDate: new Date("2026-01-01"),
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
    memberId: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildIncomeSource(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    subcategoryId: "sub-salary",
    name: "Test Salary",
    amount: 3000,
    frequency: "monthly" as const,
    incomeType: "salary" as const,
    dueDate: new Date("2026-01-01"),
    memberId: null,
    sortOrder: 0,
    endedAt: null,
    notes: null,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildItemAmountPeriod(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    itemId: "item-1",
    itemType: "income_source" as const,
    amount: 3000,
    startDate: new Date("2026-01-01"),
    endDate: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildAsset(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    name: "Test Property",
    assetType: "property" as const,
    growthRatePct: 3.0,
    memberId: null,
    notes: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildAssetBalance(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    assetId: "asset-1",
    date: new Date("2026-01-01"),
    value: 250000,
    note: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildAccount(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    name: "Test Current Account",
    accountType: "current" as const,
    isCashflowLinked: true,
    memberId: null,
    notes: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildAccountBalance(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    accountId: "account-1",
    date: new Date("2026-01-01"),
    value: 5000,
    note: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildPurchaseItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    name: "Test Purchase",
    estimatedCost: 1000,
    targetYear: 2026,
    targetMonth: 6,
    priority: "want" as const,
    status: "planned" as const,
    fundingAccountId: null,
    notes: null,
    sortOrder: 0,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildGiftPerson(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    name: "Test Person",
    notes: null,
    sortOrder: 0,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildGiftEvent(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    name: "Birthday",
    month: 6,
    isDefault: false,
    sortOrder: 0,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildGiftAllocation(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    giftPersonId: "person-1",
    giftEventId: "event-1",
    year: 2026,
    amount: 50,
    note: null,
    status: "planned" as const,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildSnapshot(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    snapshotDate: new Date("2026-01-01"),
    data: {} as Record<string, unknown>,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildHouseholdSettings(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    surplusBenchmarkPct: 10,
    isaAnnualLimit: 20000,
    isaYearStartMonth: 4,
    isaYearStartDay: 6,
    stalenessThresholds: {
      income_source: 12,
      committed_item: 6,
      discretionary_item: 12,
      wealth_account: 3,
    },
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
