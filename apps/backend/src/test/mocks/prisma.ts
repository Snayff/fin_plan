import { mock } from "bun:test";

function buildModelMock() {
  return {
    findUnique: mock(() => {}),
    findFirst: mock(() => {}),
    findMany: mock(() => {}),
    create: mock(() => {}),
    update: mock(() => {}),
    updateMany: mock(() => {}),
    delete: mock(() => {}),
    deleteMany: mock(() => {}),
    count: mock(() => {}),
    aggregate: mock(() => {}),
    groupBy: mock(() => {}),
  };
}

export const prismaMock = {
  auditLog: buildModelMock(),
  refreshToken: buildModelMock(),
  user: buildModelMock(),
  account: buildModelMock(),
  transaction: buildModelMock(),
  category: buildModelMock(),
  asset: buildModelMock(),
  assetValueHistory: buildModelMock(),
  liability: buildModelMock(),
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
  $transaction: mock((fn: (tx: any) => any) => fn(prismaMock)),
  $queryRaw: mock(() => {}),
  $disconnect: mock(() => {}),
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
