import { vi } from "vitest";

function buildModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

export const prismaMock = {
  user: buildModelMock(),
  account: buildModelMock(),
  transaction: buildModelMock(),
  category: buildModelMock(),
  asset: buildModelMock(),
  assetValueHistory: buildModelMock(),
  liability: buildModelMock(),
  liabilityPayment: buildModelMock(),
  budget: buildModelMock(),
  budgetItem: buildModelMock(),
  goal: buildModelMock(),
  goalContribution: buildModelMock(),
  recurringRule: buildModelMock(),
  device: buildModelMock(),
  forecast: buildModelMock(),
  forecastScenario: buildModelMock(),
  monteCarloSimulation: buildModelMock(),
  // Interactive transaction support: passes self so tx.model.method() resolves to same mocks
  $transaction: vi.fn((fn: (tx: any) => any) => fn(prismaMock)),
  $disconnect: vi.fn(),
};

/** Reset all mocks on the prisma mock object */
export function resetPrismaMocks() {
  for (const [key, value] of Object.entries(prismaMock)) {
    if (typeof value === "function") {
      (value as any).mockReset();
    } else if (typeof value === "object" && value !== null) {
      for (const fn of Object.values(value)) {
        if (typeof fn === "function") {
          (fn as any).mockReset();
        }
      }
    }
  }
  // Restore $transaction default behavior
  prismaMock.$transaction.mockImplementation((fn: (tx: any) => any) => fn(prismaMock));
}
