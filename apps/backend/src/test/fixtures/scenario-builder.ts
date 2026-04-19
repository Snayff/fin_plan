/**
 * Composable scenario builder for test fixtures.
 *
 * Creates a full household scenario with cross-linked IDs from a
 * declarative configuration object. Uses the entity builders from
 * `./index` under the hood.
 */

import {
  resetFixtureCounter,
  buildUser,
  buildHousehold,
  buildMember,
  buildSubcategory,
  buildIncomeSource,
  buildCommittedItem,
  buildDiscretionaryItem,
  buildAccount,
  buildAccountBalance,
  buildAsset,
  buildAssetBalance,
  buildHouseholdSettings,
} from "./index";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScenarioMemberConfig {
  name: string;
  role?: "owner" | "admin" | "member";
  email?: string;
}

export interface ScenarioIncomeConfig {
  name?: string;
  amount: number;
  frequency?: "monthly" | "annual" | "one_off" | "weekly" | "quarterly";
  ownerIndex?: number;
}

export interface ScenarioCommittedConfig {
  name?: string;
  amount: number;
  spendType?: "monthly" | "yearly" | "one_off" | "weekly" | "quarterly";
}

export interface ScenarioDiscretionaryConfig {
  name?: string;
  amount: number;
  spendType?: "monthly";
}

export interface ScenarioAccountConfig {
  name?: string;
  accountType?: string;
  balance?: number;
  ownerIndex?: number;
}

export interface ScenarioAssetConfig {
  name?: string;
  assetType?: string;
  value?: number;
  ownerIndex?: number;
}

export interface ScenarioConfig {
  householdName?: string;
  members?: ScenarioMemberConfig[];
  incomeSources?: ScenarioIncomeConfig[];
  committedItems?: ScenarioCommittedConfig[];
  discretionaryItems?: ScenarioDiscretionaryConfig[];
  accounts?: ScenarioAccountConfig[];
  assets?: ScenarioAssetConfig[];
}

export interface Scenario {
  users: ReturnType<typeof buildUser>[];
  household: ReturnType<typeof buildHousehold>;
  members: ReturnType<typeof buildMember>[];
  settings: ReturnType<typeof buildHouseholdSettings>;
  subcategories: ReturnType<typeof buildSubcategory>[];
  incomeSources: ReturnType<typeof buildIncomeSource>[];
  committedItems: ReturnType<typeof buildCommittedItem>[];
  discretionaryItems: ReturnType<typeof buildDiscretionaryItem>[];
  accounts: ReturnType<typeof buildAccount>[];
  accountBalances: ReturnType<typeof buildAccountBalance>[];
  assets: ReturnType<typeof buildAsset>[];
  assetBalances: ReturnType<typeof buildAssetBalance>[];
}

// ─── Default subcategory definitions ─────────────────────────────────────────

interface SubcategoryDef {
  tier: "income" | "committed" | "discretionary";
  name: string;
}

const DEFAULT_SUBCATEGORIES: SubcategoryDef[] = [
  { tier: "income", name: "Salary" },
  { tier: "income", name: "Other" },
  { tier: "committed", name: "Housing" },
  { tier: "committed", name: "Utilities" },
  { tier: "committed", name: "Other" },
  { tier: "discretionary", name: "Food" },
  { tier: "discretionary", name: "Entertainment" },
  { tier: "discretionary", name: "Other" },
];

// ─── Builder ─────────────────────────────────────────────────────────────────

export function buildScenario(config: ScenarioConfig = {}): Scenario {
  resetFixtureCounter();

  // --- Household ---
  const household = buildHousehold({
    name: config.householdName ?? "Test Household",
  });
  const householdId = household.id;

  // --- Users & Members ---
  const memberConfigs: ScenarioMemberConfig[] =
    config.members && config.members.length > 0
      ? config.members
      : [{ name: "Owner", role: "owner" }];

  const users: ReturnType<typeof buildUser>[] = [];
  const members: ReturnType<typeof buildMember>[] = [];

  for (let i = 0; i < memberConfigs.length; i++) {
    const mc = memberConfigs[i]!;
    const role = mc.role ?? (i === 0 ? "owner" : "member");
    const user = buildUser({
      name: mc.name,
      email: mc.email ?? `${mc.name.toLowerCase().replace(/\s+/g, "-")}-${householdId}@test.com`,
    });
    users.push(user);

    const member = buildMember({
      householdId,
      userId: user.id,
      name: mc.name,
      role,
    });
    members.push(member);
  }

  // --- Settings ---
  const settings = buildHouseholdSettings({ householdId });

  // --- Subcategories ---
  const subcategories: ReturnType<typeof buildSubcategory>[] = [];
  const subcategoryByKey = new Map<string, string>();

  for (let i = 0; i < DEFAULT_SUBCATEGORIES.length; i++) {
    const def = DEFAULT_SUBCATEGORIES[i]!;
    const sub = buildSubcategory({
      householdId,
      tier: def.tier,
      name: def.name,
      sortOrder: i,
      isDefault: def.name === "Other",
    });
    subcategories.push(sub);
    subcategoryByKey.set(`${def.tier}:${def.name}`, sub.id);
  }

  // Helper to resolve a subcategory ID by tier and name
  function subId(tier: string, name: string): string {
    return subcategoryByKey.get(`${tier}:${name}`) ?? subcategories[0]!.id;
  }

  // --- Income Sources ---
  const incomeSources: ReturnType<typeof buildIncomeSource>[] = [];
  if (config.incomeSources) {
    for (let i = 0; i < config.incomeSources.length; i++) {
      const ic = config.incomeSources[i]!;
      const ownerId = ic.ownerIndex !== undefined ? (users[ic.ownerIndex]?.id ?? null) : null;
      incomeSources.push(
        buildIncomeSource({
          householdId,
          subcategoryId: subId("income", "Salary"),
          name: ic.name ?? `Income ${i + 1}`,
          amount: ic.amount,
          frequency: ic.frequency ?? "monthly",
          ownerId,
          sortOrder: i,
        })
      );
    }
  }

  // --- Committed Items ---
  const committedItems: ReturnType<typeof buildCommittedItem>[] = [];
  if (config.committedItems) {
    for (let i = 0; i < config.committedItems.length; i++) {
      const ci = config.committedItems[i]!;
      committedItems.push(
        buildCommittedItem({
          householdId,
          subcategoryId: subId("committed", "Other"),
          name: ci.name ?? `Committed ${i + 1}`,
          amount: ci.amount,
          spendType: ci.spendType ?? "monthly",
          sortOrder: i,
        })
      );
    }
  }

  // --- Discretionary Items ---
  const discretionaryItems: ReturnType<typeof buildDiscretionaryItem>[] = [];
  if (config.discretionaryItems) {
    for (let i = 0; i < config.discretionaryItems.length; i++) {
      const di = config.discretionaryItems[i]!;
      discretionaryItems.push(
        buildDiscretionaryItem({
          householdId,
          subcategoryId: subId("discretionary", "Other"),
          name: di.name ?? `Discretionary ${i + 1}`,
          amount: di.amount,
          spendType: di.spendType ?? "monthly",
          sortOrder: i,
        })
      );
    }
  }

  // --- Accounts & Account Balances ---
  const accounts: ReturnType<typeof buildAccount>[] = [];
  const accountBalances: ReturnType<typeof buildAccountBalance>[] = [];
  if (config.accounts) {
    for (let i = 0; i < config.accounts.length; i++) {
      const ac = config.accounts[i]!;
      const ownerId = ac.ownerIndex !== undefined ? (users[ac.ownerIndex]?.id ?? null) : null;
      const account = buildAccount({
        householdId,
        name: ac.name ?? `Account ${i + 1}`,
        accountType: ac.accountType ?? "current",
        ownerId,
        sortOrder: i,
      });
      accounts.push(account);

      if (ac.balance !== undefined) {
        accountBalances.push(
          buildAccountBalance({
            accountId: account.id,
            value: ac.balance,
          })
        );
      }
    }
  }

  // --- Assets & Asset Balances ---
  const assets: ReturnType<typeof buildAsset>[] = [];
  const assetBalances: ReturnType<typeof buildAssetBalance>[] = [];
  if (config.assets) {
    for (let i = 0; i < config.assets.length; i++) {
      const as_ = config.assets[i]!;
      const ownerId = as_.ownerIndex !== undefined ? (users[as_.ownerIndex]?.id ?? null) : null;
      const asset = buildAsset({
        householdId,
        name: as_.name ?? `Asset ${i + 1}`,
        assetType: as_.assetType ?? "property",
        ownerId,
        sortOrder: i,
      });
      assets.push(asset);

      if (as_.value !== undefined) {
        assetBalances.push(
          buildAssetBalance({
            assetId: asset.id,
            value: as_.value,
          })
        );
      }
    }
  }

  return {
    users,
    household,
    members,
    settings,
    subcategories,
    incomeSources,
    committedItems,
    discretionaryItems,
    accounts,
    accountBalances,
    assets,
    assetBalances,
  };
}

// ─── Convenience Scenarios ───────────────────────────────────────────────────

/** Solo owner with no financial items. */
export function buildEmptyScenario(): Scenario {
  return buildScenario({
    householdName: "Empty Household",
  });
}

/** Solo owner with 1 income, 1 committed, 1 discretionary. */
export function buildMinimalScenario(): Scenario {
  return buildScenario({
    householdName: "Minimal Household",
    incomeSources: [{ name: "Salary", amount: 3000 }],
    committedItems: [{ name: "Rent", amount: 1000 }],
    discretionaryItems: [{ name: "Groceries", amount: 200 }],
  });
}

/** Solo owner with a weekly income source. */
export function buildWeeklyIncomeScenario(amount: number = 520): Scenario {
  return buildScenario({
    householdName: "Weekly Income Household",
    incomeSources: [{ name: "Weekly Salary", amount, frequency: "weekly" }],
  });
}

/** Solo owner with a quarterly committed item. */
export function buildQuarterlyBillScenario(amount: number = 300): Scenario {
  return buildScenario({
    householdName: "Quarterly Bill Household",
    committedItems: [{ name: "Quarterly Service", amount, spendType: "quarterly" }],
  });
}

/** Two members, two incomes, three committed, three discretionary. */
export function buildDualIncomeScenario(): Scenario {
  return buildScenario({
    householdName: "Dual Income Household",
    members: [
      { name: "Alice", role: "owner" },
      { name: "Bob", role: "member" },
    ],
    incomeSources: [
      { name: "Alice Salary", amount: 3500, ownerIndex: 0 },
      { name: "Bob Salary", amount: 2800, ownerIndex: 1 },
    ],
    committedItems: [
      { name: "Rent", amount: 1200 },
      { name: "Internet", amount: 45 },
      { name: "Home Insurance", amount: 600, spendType: "yearly" },
    ],
    discretionaryItems: [
      { name: "Groceries", amount: 500 },
      { name: "Dining Out", amount: 150 },
      { name: "Emergency Fund", amount: 200 },
    ],
  });
}
