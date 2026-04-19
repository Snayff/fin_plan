import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildMember, buildHousehold } from "../test/fixtures";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { exportService } from "./export.service";
import { importService } from "./import.service";
import { householdExportSchema } from "@finplan/shared";

beforeEach(() => resetPrismaMocks());

// ---------------------------------------------------------------------------
// Shared IDs
// ---------------------------------------------------------------------------
const HOUSEHOLD_ID = "household-1";
const NEW_HOUSEHOLD_ID = "new-hh-id";
const CALLER_USER_ID = "user-1";

const MEMBER_ALICE = buildMember({
  id: "member-alice",
  householdId: HOUSEHOLD_ID,
  userId: CALLER_USER_ID,
  name: "Alice",
  role: "owner",
  dateOfBirth: new Date("1990-06-15T00:00:00Z"),
  retirementYear: 2055,
});

const MEMBER_BOB = buildMember({
  id: "member-bob",
  householdId: HOUSEHOLD_ID,
  userId: "user-2",
  name: "Bob",
  role: "member",
  dateOfBirth: null,
  retirementYear: null,
});

// ---------------------------------------------------------------------------
// Helper: set up all prisma mocks so exportService.exportHousehold succeeds
// ---------------------------------------------------------------------------
function setupExportMocks() {
  // Auth check — caller is owner
  prismaMock.member.findFirst.mockResolvedValue(MEMBER_ALICE);

  // Household
  prismaMock.household.findUnique.mockResolvedValue(
    buildHousehold({ id: HOUSEHOLD_ID, name: "Test Household" })
  );

  // Settings
  prismaMock.householdSettings.findUnique.mockResolvedValue({
    householdId: HOUSEHOLD_ID,
    surplusBenchmarkPct: 20,
    isaAnnualLimit: 20000,
    isaYearStartMonth: 4,
    isaYearStartDay: 6,
    stalenessThresholds: {
      income_source: 90,
      committed_item: 90,
      discretionary_item: 90,
      asset_item: 180,
      account_item: 180,
    },
    currentRatePct: 0.5,
    savingsRatePct: 10,
    investmentRatePct: 5,
    pensionRatePct: 8,
    inflationRatePct: 2.5,
    showPence: false,
  });

  // Members
  prismaMock.member.findMany.mockResolvedValue([MEMBER_ALICE, MEMBER_BOB]);

  // Subcategories
  prismaMock.subcategory.findMany.mockResolvedValue([
    {
      id: "sub-salary",
      householdId: HOUSEHOLD_ID,
      tier: "income",
      name: "Salary",
      sortOrder: 0,
      isLocked: false,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "sub-bills",
      householdId: HOUSEHOLD_ID,
      tier: "committed",
      name: "Bills",
      sortOrder: 1,
      isLocked: false,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Income sources (with subcategory include)
  prismaMock.incomeSource.findMany.mockResolvedValue([
    {
      id: "inc-1",
      householdId: HOUSEHOLD_ID,
      subcategoryId: "sub-salary",
      name: "Day job",
      frequency: "monthly",
      incomeType: "salary",
      dueDate: new Date("2026-04-01"),
      ownerId: "member-alice",
      sortOrder: 0,
      lastReviewedAt: new Date("2026-01-15T00:00:00Z"),
      notes: "Primary income",
      subcategory: { name: "Salary" },
    },
  ]);

  // Committed items (with subcategory include)
  prismaMock.committedItem.findMany.mockResolvedValue([
    {
      id: "comm-1",
      householdId: HOUSEHOLD_ID,
      subcategoryId: "sub-bills",
      name: "Electric",
      spendType: "monthly",
      notes: null,
      ownerId: "member-bob",
      dueDate: new Date("2026-04-01"),
      sortOrder: 0,
      lastReviewedAt: new Date("2026-02-01T00:00:00Z"),
      subcategory: { name: "Bills" },
    },
  ]);

  // Discretionary items — none in this test
  prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

  // Assets (with balances include)
  prismaMock.asset.findMany.mockResolvedValue([
    {
      id: "asset-1",
      householdId: HOUSEHOLD_ID,
      name: "House",
      type: "Property",
      memberId: "member-alice",
      growthRatePct: 3.5,
      lastReviewedAt: new Date("2026-03-01T00:00:00Z"),
      balances: [
        {
          id: "ab-1",
          assetId: "asset-1",
          value: 350000,
          date: new Date("2026-03-01"),
          note: "Initial valuation",
          createdAt: new Date(),
        },
      ],
    },
  ]);

  // Accounts (with balances include)
  prismaMock.account.findMany.mockResolvedValue([
    {
      id: "acct-1",
      householdId: HOUSEHOLD_ID,
      name: "ISA",
      type: "Savings",
      memberId: "member-bob",
      growthRatePct: 4.0,
      lastReviewedAt: new Date("2026-03-01T00:00:00Z"),
      balances: [
        {
          id: "acb-1",
          accountId: "acct-1",
          value: 15000,
          date: new Date("2026-03-01"),
          note: null,
          createdAt: new Date(),
        },
      ],
    },
  ]);

  // Purchase items
  prismaMock.purchaseItem.findMany.mockResolvedValue([
    {
      id: "pi-1",
      householdId: HOUSEHOLD_ID,
      yearAdded: 2026,
      name: "New sofa",
      estimatedCost: 1200,
      priority: "medium",
      scheduledThisYear: true,
      fundingSources: ["savings"],
      fundingAccountId: null,
      status: "not_started",
      reason: null,
      comment: "For the living room",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Planner year budgets
  prismaMock.plannerYearBudget.findMany.mockResolvedValue([
    {
      id: "pyb-1",
      householdId: HOUSEHOLD_ID,
      year: 2026,
      purchaseBudget: 5000,
      giftBudget: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Gift planner settings
  prismaMock.giftPlannerSettings.findUnique.mockResolvedValue({
    id: "gps-1",
    householdId: HOUSEHOLD_ID,
    mode: "synced",
    syncedDiscretionaryItemId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Gift persons (flat, no nested events)
  prismaMock.giftPerson.findMany.mockResolvedValue([
    {
      id: "gp-1",
      householdId: HOUSEHOLD_ID,
      name: "Mum",
      notes: "Likes flowers",
      sortOrder: 0,
      memberId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Gift events (flat, household-level)
  prismaMock.giftEvent.findMany.mockResolvedValue([
    {
      id: "ge-1",
      householdId: HOUSEHOLD_ID,
      name: "Birthday",
      dateType: "personal",
      dateMonth: 8,
      dateDay: 20,
      isLocked: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Gift allocations (person x event x year)
  prismaMock.giftAllocation.findMany.mockResolvedValue([
    {
      id: "ga-1",
      householdId: HOUSEHOLD_ID,
      giftPersonId: "gp-1",
      giftEventId: "ge-1",
      year: 2026,
      planned: 50,
      spent: null,
      status: "planned",
      notes: "Bouquet + card",
      dateMonth: 8,
      dateDay: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Item amount periods (bulk fetch for all waterfall items)
  prismaMock.itemAmountPeriod.findMany.mockResolvedValue([
    {
      id: "period-1",
      itemType: "income_source",
      itemId: "inc-1",
      startDate: new Date("2026-01-01"),
      endDate: null,
      amount: 3500,
      createdAt: new Date(),
    },
    {
      id: "period-2",
      itemType: "committed_item",
      itemId: "comm-1",
      startDate: new Date("2026-01-01"),
      endDate: null,
      amount: 85,
      createdAt: new Date(),
    },
  ]);

  // Waterfall history — empty for this test
  prismaMock.waterfallHistory.findMany.mockResolvedValue([]);
}

// ---------------------------------------------------------------------------
// Helper: set up prisma mocks so importService.importHousehold (create_new)
// succeeds — returns IDs for every created entity
// ---------------------------------------------------------------------------
function setupImportMocks() {
  // Caller user lookup
  prismaMock.user.findUnique.mockResolvedValue({ id: CALLER_USER_ID, name: "Alice" });

  // Household create
  prismaMock.household.create.mockResolvedValue({
    id: NEW_HOUSEHOLD_ID,
    name: "Test Household",
  });

  // Member creates: first the owner (Alice), then Bob
  prismaMock.member.create
    .mockResolvedValueOnce(
      buildMember({
        id: "new-member-alice",
        householdId: NEW_HOUSEHOLD_ID,
        userId: CALLER_USER_ID,
        name: "Alice",
        role: "owner",
      })
    )
    .mockResolvedValueOnce(
      buildMember({
        id: "new-member-bob",
        householdId: NEW_HOUSEHOLD_ID,
        userId: null,
        name: "Bob",
        role: "member",
      })
    );

  // member.findMany after imports — used to build name -> id map
  // This is called inside the transaction after members are created.
  // The first findMany was consumed by export; import calls it again.
  prismaMock.member.findMany.mockResolvedValue([
    buildMember({
      id: "new-member-alice",
      householdId: NEW_HOUSEHOLD_ID,
      userId: CALLER_USER_ID,
      name: "Alice",
      role: "owner",
    }),
    buildMember({
      id: "new-member-bob",
      householdId: NEW_HOUSEHOLD_ID,
      userId: null,
      name: "Bob",
      role: "member",
    }),
  ]);

  // Settings upsert
  prismaMock.householdSettings.upsert.mockResolvedValue({});

  // Subcategory creates
  prismaMock.subcategory.create
    .mockResolvedValueOnce({
      id: "new-sub-salary",
      householdId: NEW_HOUSEHOLD_ID,
      tier: "income",
      name: "Salary",
    })
    .mockResolvedValueOnce({
      id: "new-sub-bills",
      householdId: NEW_HOUSEHOLD_ID,
      tier: "committed",
      name: "Bills",
    });

  // Income source create
  prismaMock.incomeSource.create.mockResolvedValue({
    id: "new-inc-1",
    householdId: NEW_HOUSEHOLD_ID,
    subcategoryId: "new-sub-salary",
    name: "Day job",
  });

  // Committed item create
  prismaMock.committedItem.create.mockResolvedValue({
    id: "new-comm-1",
    householdId: NEW_HOUSEHOLD_ID,
    subcategoryId: "new-sub-bills",
    name: "Electric",
  });

  // Item amount period creates (one for income, one for committed)
  prismaMock.itemAmountPeriod.create
    .mockResolvedValueOnce({ id: "new-period-1" })
    .mockResolvedValueOnce({ id: "new-period-2" });

  // Asset create
  prismaMock.asset.create.mockResolvedValue({
    id: "new-asset-1",
    householdId: NEW_HOUSEHOLD_ID,
    name: "House",
  });

  // Asset balance create
  prismaMock.assetBalance.create.mockResolvedValue({ id: "new-ab-1" });

  // Account create
  prismaMock.account.create.mockResolvedValue({
    id: "new-acct-1",
    householdId: NEW_HOUSEHOLD_ID,
    name: "ISA",
  });

  // Account balance create
  prismaMock.accountBalance.create.mockResolvedValue({ id: "new-acb-1" });

  // Purchase item create
  prismaMock.purchaseItem.create.mockResolvedValue({ id: "new-pi-1" });

  // Planner year budget create
  prismaMock.plannerYearBudget.create.mockResolvedValue({ id: "new-pyb-1" });

  // Gift planner settings upsert
  prismaMock.giftPlannerSettings.upsert.mockResolvedValue({});

  // Gift person create
  prismaMock.giftPerson.create.mockResolvedValue({
    id: "new-gp-1",
    householdId: NEW_HOUSEHOLD_ID,
    name: "Mum",
  });

  // Gift event create
  prismaMock.giftEvent.create.mockResolvedValue({
    id: "new-ge-1",
    householdId: NEW_HOUSEHOLD_ID,
    name: "Birthday",
  });

  // Gift allocation create
  prismaMock.giftAllocation.create.mockResolvedValue({ id: "new-ga-1" });
}

describe("export → import round-trip", () => {
  it("round-trip: export → import preserves all data sections", async () => {
    // ---------------------------------------------------------------
    // STEP 1: Export — get a complete envelope from mock data
    // ---------------------------------------------------------------
    setupExportMocks();

    const envelope = await exportService.exportHousehold(HOUSEHOLD_ID, CALLER_USER_ID);

    // Validate the export envelope against the Zod schema
    const parseResult = householdExportSchema.safeParse(envelope);
    expect(parseResult.success).toBe(true);

    // Quick structural sanity checks on the export
    expect(envelope.schemaVersion).toBe(2);
    expect(envelope.household.name).toBe("Test Household");
    expect(envelope.members).toHaveLength(2);
    expect(envelope.subcategories).toHaveLength(2);
    expect(envelope.incomeSources).toHaveLength(1);
    expect(envelope.committedItems).toHaveLength(1);
    expect(envelope.discretionaryItems).toHaveLength(0);
    expect(envelope.assets).toHaveLength(1);
    expect(envelope.accounts).toHaveLength(1);
    expect(envelope.purchaseItems).toHaveLength(1);
    expect(envelope.plannerYearBudgets).toHaveLength(1);
    expect(envelope.gifts.settings.mode).toBe("synced");
    expect(envelope.gifts.people).toHaveLength(1);
    expect(envelope.gifts.events).toHaveLength(1);
    expect(envelope.gifts.allocations).toHaveLength(1);
    expect(envelope.itemAmountPeriods).toHaveLength(2);
    expect(envelope.incomeSources[0]!.periods).toHaveLength(1);
    expect(envelope.committedItems[0]!.periods).toHaveLength(1);

    // Verify name-based references resolved correctly
    expect(envelope.incomeSources[0]!.ownerName).toBe("Alice");
    expect(envelope.committedItems[0]!.ownerName).toBe("Bob");
    expect(envelope.assets[0]!.ownerName).toBe("Alice");
    expect(envelope.accounts[0]!.ownerName).toBe("Bob");

    // ---------------------------------------------------------------
    // STEP 2: Import the envelope into a new household (create_new)
    // ---------------------------------------------------------------
    resetPrismaMocks();
    setupImportMocks();

    const importResult = await importService.importHousehold(
      "ignored",
      CALLER_USER_ID,
      envelope,
      "create_new"
    );

    expect(importResult.success).toBe(true);
    expect(importResult.householdId).toBe(NEW_HOUSEHOLD_ID);

    // ---------------------------------------------------------------
    // STEP 3: Verify the import called the right prisma methods
    // ---------------------------------------------------------------

    // Household created with the exported name
    expect(prismaMock.household.create).toHaveBeenCalledWith({
      data: { name: "Test Household" },
    });

    // Two member creates: owner Alice (auto-created) + non-caller Bob
    expect(prismaMock.member.create).toHaveBeenCalledTimes(2);
    // First call: owner member (Alice)
    expect(prismaMock.member.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        userId: CALLER_USER_ID,
        name: "Alice",
        role: "owner",
      }),
    });
    // Second call: non-caller member (Bob) — demoted from owner to member
    expect(prismaMock.member.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        userId: null,
        name: "Bob",
        role: "member",
      }),
    });

    // Settings upserted
    expect(prismaMock.householdSettings.upsert).toHaveBeenCalledWith({
      where: { householdId: NEW_HOUSEHOLD_ID },
      create: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        surplusBenchmarkPct: 20,
        showPence: false,
        currentRatePct: 0.5,
      }),
      update: expect.objectContaining({
        surplusBenchmarkPct: 20,
        showPence: false,
        currentRatePct: 0.5,
      }),
    });

    // Two subcategories created
    expect(prismaMock.subcategory.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.subcategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        tier: "income",
        name: "Salary",
      }),
    });
    expect(prismaMock.subcategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        tier: "committed",
        name: "Bills",
      }),
    });

    // Income source created with resolved subcategoryId and ownerId
    expect(prismaMock.incomeSource.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.incomeSource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        subcategoryId: "new-sub-salary",
        name: "Day job",
        frequency: "monthly",
        incomeType: "salary",
        ownerId: "new-member-alice",
        notes: "Primary income",
      }),
    });

    // Committed item created with resolved subcategoryId and ownerId (Bob)
    expect(prismaMock.committedItem.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.committedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        subcategoryId: "new-sub-bills",
        name: "Electric",
        spendType: "monthly",
        ownerId: "new-member-bob",
      }),
    });

    // Two item amount periods — one for income source, one for committed item
    expect(prismaMock.itemAmountPeriod.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.itemAmountPeriod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemType: "income_source",
        itemId: "new-inc-1",
        amount: 3500,
      }),
    });
    expect(prismaMock.itemAmountPeriod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemType: "committed_item",
        itemId: "new-comm-1",
        amount: 85,
      }),
    });

    // Asset created with resolved memberId (Alice)
    expect(prismaMock.asset.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.asset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        name: "House",
        type: "Property",
        memberId: "new-member-alice",
        growthRatePct: 3.5,
      }),
    });

    // Asset balance created
    expect(prismaMock.assetBalance.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.assetBalance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assetId: "new-asset-1",
        value: 350000,
        note: "Initial valuation",
      }),
    });

    // Account created with resolved memberId (Bob)
    expect(prismaMock.account.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.account.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        name: "ISA",
        type: "Savings",
        memberId: "new-member-bob",
      }),
    });

    // Account balance created
    expect(prismaMock.accountBalance.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.accountBalance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: "new-acct-1",
        value: 15000,
      }),
    });

    // Purchase item created (fundingAccountId nulled out — not portable)
    expect(prismaMock.purchaseItem.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.purchaseItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        name: "New sofa",
        estimatedCost: 1200,
        priority: "medium",
        scheduledThisYear: true,
        fundingSources: ["savings"],
        fundingAccountId: null,
        status: "not_started",
        comment: "For the living room",
      }),
    });

    // Planner year budget created
    expect(prismaMock.plannerYearBudget.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.plannerYearBudget.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        year: 2026,
        purchaseBudget: 5000,
        giftBudget: 1000,
      }),
    });

    // Gift planner settings upserted
    expect(prismaMock.giftPlannerSettings.upsert).toHaveBeenCalledWith({
      where: { householdId: NEW_HOUSEHOLD_ID },
      create: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        mode: "synced",
        syncedDiscretionaryItemId: null,
      }),
      update: expect.objectContaining({
        mode: "synced",
        syncedDiscretionaryItemId: null,
      }),
    });

    // Gift person created
    expect(prismaMock.giftPerson.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.giftPerson.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        name: "Mum",
        notes: "Likes flowers",
        sortOrder: 0,
      }),
    });

    // Gift event created
    expect(prismaMock.giftEvent.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.giftEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        name: "Birthday",
        dateType: "personal",
        dateMonth: 8,
        dateDay: 20,
        isLocked: false,
        sortOrder: 0,
      }),
    });

    // Gift allocation created
    expect(prismaMock.giftAllocation.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.giftAllocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: NEW_HOUSEHOLD_ID,
        giftPersonId: "new-gp-1",
        giftEventId: "new-ge-1",
        year: 2026,
        planned: 50,
        status: "planned",
        notes: "Bouquet + card",
        dateMonth: 8,
        dateDay: 20,
      }),
    });
  });

  it("round-trips dueDate fields", async () => {
    setupExportMocks();
    const exported = await exportService.exportHousehold(HOUSEHOLD_ID, CALLER_USER_ID);
    const incomes = exported.incomeSources;
    expect(incomes[0]).toHaveProperty("dueDate");
  });
});
