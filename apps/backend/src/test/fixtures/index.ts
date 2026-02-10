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

export function buildAccount(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    name: "Test Account",
    type: "current" as const,
    subtype: null,
    currency: "GBP",
    metadata: {},
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildTransaction(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    accountId: "account-1",
    categoryId: null,
    subcategoryId: null,
    date: new Date("2025-01-15T12:00:00Z"),
    amount: 100.0,
    type: "expense" as const,
    name: "Test Transaction",
    description: null,
    memo: null,
    tags: [],
    isRecurring: false,
    recurrence: "none" as const,
    recurringRuleId: null,
    recurrence_end_date: null,
    metadata: {},
    createdAt: new Date("2025-01-15T12:00:00Z"),
    updatedAt: new Date("2025-01-15T12:00:00Z"),
    ...overrides,
  };
}

export function buildAsset(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    name: "Test Property",
    type: "real_estate" as const,
    currentValue: 250000,
    purchaseValue: 200000,
    purchaseDate: new Date("2020-06-15T00:00:00Z"),
    expectedGrowthRate: 3.0,
    liquidityType: "illiquid" as const,
    accountId: null,
    metadata: {},
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildLiability(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    name: "Test Mortgage",
    type: "mortgage" as const,
    currentBalance: 200000,
    originalAmount: 250000,
    interestRate: 3.5,
    interestType: "fixed" as const,
    minimumPayment: 898,
    paymentFrequency: "monthly" as const,
    payoffDate: null,
    accountId: null,
    metadata: {},
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildLiabilityPayment(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    liabilityId: "liability-1",
    transactionId: "transaction-1",
    principalAmount: 500,
    interestAmount: 398,
    date: new Date("2025-02-01T00:00:00Z"),
    createdAt: new Date("2025-02-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildAssetValueHistory(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    assetId: "asset-1",
    value: 250000,
    date: new Date("2025-01-01T00:00:00Z"),
    source: "manual" as const,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildCategory(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    name: "Test Category",
    type: "expense" as const,
    parentCategoryId: null,
    color: "#FF0000",
    icon: "tag",
    isSystemCategory: false,
    sortOrder: 0,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
