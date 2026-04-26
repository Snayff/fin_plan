import { prisma } from "../config/database.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { toMonthlyAmount } from "@finplan/shared";
import type {
  AssetType,
  AccountType,
  CreateAssetInput,
  UpdateAssetInput,
  RecordAssetBalanceInput,
  CreateAccountInput,
  UpdateAccountInput,
  RecordAccountBalanceInput,
} from "@finplan/shared";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLatestBalance<T extends { date: Date; createdAt: Date }>(balances: T[]): T | null {
  if (balances.length === 0) return null;
  return balances.reduce((best, curr) => {
    if (curr.date > best.date) return curr;
    if (curr.date < best.date) return best;
    return curr.createdAt > best.createdAt ? curr : best;
  });
}

async function assertAssetOwned(householdId: string, assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, householdId: true },
  });
  if (!asset || asset.householdId !== householdId) {
    throw new NotFoundError("Asset not found");
  }
  return asset;
}

async function assertAccountOwned(householdId: string, accountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, householdId: true },
  });
  if (!account || account.householdId !== householdId) {
    throw new NotFoundError("Account not found");
  }
  return account;
}

async function assertMemberInHousehold(householdId: string, memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, householdId: true },
  });
  if (!member || member.householdId !== householdId) {
    throw new ValidationError("Member not found in household");
  }
}

// ── Disposal helpers ─────────────────────────────────────────────────────────

interface DisposalPatch {
  disposedAt?: string | null;
  disposalAccountId?: string | null;
}

interface ResolvedDisposal {
  /** undefined = field not in patch (no change); Date | null otherwise */
  disposedAt?: Date | null;
  /** undefined = field not in patch (no change); string | null otherwise */
  disposalAccountId?: string | null;
}

/**
 * Validate a disposal patch and resolve the ISO date string into a Date.
 *
 * Rules:
 *   - If neither disposedAt nor disposalAccountId is in the patch → no-op.
 *   - If one is provided, the other must be too (both set, or both null).
 *   - When set: target Account must exist in this household and ≠ source.
 */
async function resolveDisposalPatch(
  householdId: string,
  data: DisposalPatch,
  sourceAccountId: string | null
): Promise<ResolvedDisposal> {
  const { disposedAt, disposalAccountId } = data;
  const dateProvided = disposedAt !== undefined;
  const acctProvided = disposalAccountId !== undefined;
  if (!dateProvided && !acctProvided) return {};
  if (dateProvided !== acctProvided) {
    throw new ValidationError("disposedAt and disposalAccountId must be set or cleared together");
  }
  const dateSet = disposedAt != null;
  const acctSet = disposalAccountId != null;
  if (dateSet !== acctSet) {
    throw new ValidationError("disposedAt and disposalAccountId must be set or cleared together");
  }
  if (acctSet) {
    if (sourceAccountId && disposalAccountId === sourceAccountId) {
      throw new ValidationError("An account cannot dispose into itself");
    }
    await assertAccountOwned(householdId, disposalAccountId!);
    return { disposedAt: new Date(disposedAt!), disposalAccountId };
  }
  return { disposedAt: null, disposalAccountId: null };
}

const ASSET_TYPES: AssetType[] = ["Property", "Vehicle", "Other"];
const ACCOUNT_TYPES: AccountType[] = ["Current", "Savings", "Pension", "StocksAndShares", "Other"];

// "Active" = no disposal date set, OR disposal date is in the future.
// Items with disposedAt <= today are historical and excluded from default lists.
function activeWhere() {
  const today = startOfDayUtc(new Date());
  return {
    OR: [{ disposedAt: null }, { disposedAt: { gt: today } }],
  };
}

function startOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ── Service ──────────────────────────────────────────────────────────────────

export const assetsService = {
  async getSummary(householdId: string) {
    // Summaries reflect ACTIVE holdings only — disposed items are historical.
    const [assets, accounts] = await Promise.all([
      prisma.asset.findMany({
        where: { householdId, ...activeWhere() },
        include: { balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] } },
      }),
      prisma.account.findMany({
        where: { householdId, ...activeWhere() },
        include: { balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] } },
      }),
    ]);

    const assetTotals = Object.fromEntries(
      ASSET_TYPES.map((t) => [
        t,
        assets
          .filter((a) => a.type === t)
          .reduce((sum, a) => sum + (getLatestBalance(a.balances)?.value ?? 0), 0),
      ])
    ) as Record<AssetType, number>;

    const accountTotals = Object.fromEntries(
      ACCOUNT_TYPES.map((t) => [
        t,
        accounts
          .filter((a) => a.type === t)
          .reduce((sum, a) => sum + (getLatestBalance(a.balances)?.value ?? 0), 0),
      ])
    ) as Record<AccountType, number>;

    const grandTotal =
      Object.values(assetTotals).reduce((s, v) => s + v, 0) +
      Object.values(accountTotals).reduce((s, v) => s + v, 0);

    return { assetTotals, accountTotals, grandTotal };
  },

  // ── Assets ──────────────────────────────────────────────────────────────────

  async listAssetsByType(
    householdId: string,
    type: AssetType,
    opts: { includeDisposed?: boolean } = {}
  ) {
    const assets = await prisma.asset.findMany({
      where: { householdId, type, ...(opts.includeDisposed ? {} : activeWhere()) },
      include: {
        balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
      },
      orderBy: { createdAt: "asc" },
    });

    return assets.map((a) => {
      const latest = getLatestBalance(a.balances);
      return {
        ...a,
        currentBalance: latest?.value ?? 0,
        currentBalanceDate: latest?.date ?? null,
      };
    });
  },

  async createAsset(householdId: string, data: CreateAssetInput, ctx: ActorCtx) {
    if (data.memberId) {
      await assertMemberInHousehold(householdId, data.memberId);
    }
    const resolved = await resolveDisposalPatch(
      householdId,
      { disposedAt: data.disposedAt, disposalAccountId: data.disposalAccountId },
      null
    );
    const {
      initialValue,
      disposedAt: _ignoredDate,
      disposalAccountId: _ignoredAcct,
      ...rest
    } = data;
    void _ignoredDate;
    void _ignoredAcct;
    return audited({
      db: prisma,
      ctx,
      action: "CREATE_ASSET",
      resource: "asset",
      resourceId: "",
      beforeFetch: async () => null,
      mutation: async (tx) => {
        const asset = await tx.asset.create({
          data: { householdId, ...rest, ...resolved },
        });
        if (initialValue !== undefined) {
          await tx.assetBalance.create({
            data: {
              assetId: asset.id,
              value: initialValue,
              date: new Date(),
            },
          });
        }
        return asset;
      },
    });
  },

  async updateAsset(householdId: string, assetId: string, data: UpdateAssetInput, ctx: ActorCtx) {
    await assertAssetOwned(householdId, assetId);
    if (data.memberId) {
      await assertMemberInHousehold(householdId, data.memberId);
    }
    const resolved = await resolveDisposalPatch(
      householdId,
      { disposedAt: data.disposedAt, disposalAccountId: data.disposalAccountId },
      null
    );
    const { disposedAt: _ignoredDate, disposalAccountId: _ignoredAcct, ...rest } = data;
    void _ignoredDate;
    void _ignoredAcct;
    return audited({
      db: prisma,
      ctx,
      action: "UPDATE_ASSET",
      resource: "asset",
      resourceId: assetId,
      beforeFetch: async (tx) =>
        tx.asset.findUnique({ where: { id: assetId } }) as Promise<Record<string, unknown> | null>,
      mutation: async (tx) =>
        tx.asset.update({ where: { id: assetId }, data: { ...rest, ...resolved } }),
    });
  },

  async deleteAsset(householdId: string, assetId: string, ctx: ActorCtx) {
    await assertAssetOwned(householdId, assetId);
    return audited({
      db: prisma,
      ctx,
      action: "DELETE_ASSET",
      resource: "asset",
      resourceId: assetId,
      beforeFetch: async (tx) =>
        tx.asset.findUnique({ where: { id: assetId } }) as Promise<Record<string, unknown> | null>,
      mutation: async (tx) => tx.asset.delete({ where: { id: assetId } }),
    });
  },

  async recordAssetBalance(
    householdId: string,
    assetId: string,
    data: RecordAssetBalanceInput,
    ctx: ActorCtx
  ) {
    await assertAssetOwned(householdId, assetId);
    return audited({
      db: prisma,
      ctx,
      action: "RECORD_ASSET_BALANCE",
      resource: "asset-balance",
      resourceId: assetId,
      beforeFetch: async (_tx) => null,
      mutation: async (tx) => {
        const balance = await tx.assetBalance.create({
          data: {
            assetId,
            value: data.value,
            date: new Date(data.date),
            note: data.note ?? null,
          },
        });
        await tx.asset.update({
          where: { id: assetId },
          data: { lastReviewedAt: new Date() },
        });
        return balance;
      },
    });
  },

  async confirmAsset(householdId: string, assetId: string, ctx: ActorCtx) {
    await assertAssetOwned(householdId, assetId);
    return audited({
      db: prisma,
      ctx,
      action: "CONFIRM_ASSET",
      resource: "asset",
      resourceId: assetId,
      beforeFetch: async (_tx) => null,
      mutation: async (tx) =>
        tx.asset.update({
          where: { id: assetId },
          data: { lastReviewedAt: new Date() },
        }),
    });
  },

  // ── Accounts ─────────────────────────────────────────────────────────────────

  async listAccountsByType(
    householdId: string,
    type: AccountType,
    opts: { includeDisposed?: boolean } = {}
  ) {
    const accounts = await prisma.account.findMany({
      where: { householdId, type, ...(opts.includeDisposed ? {} : activeWhere()) },
      include: {
        balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
        linkedItems: { select: { id: true, name: true, spendType: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Derive current monthly amounts for all linked discretionary items
    const allLinkedItemIds = accounts.flatMap((a) => a.linkedItems.map((i) => i.id));
    const now = new Date();
    const activePeriods =
      allLinkedItemIds.length > 0
        ? await prisma.itemAmountPeriod.findMany({
            where: {
              itemType: "discretionary_item",
              itemId: { in: allLinkedItemIds },
              startDate: { lte: now },
              OR: [{ endDate: null }, { endDate: { gt: now } }],
            },
          })
        : [];

    const amountByItemId = new Map<string, number>();
    for (const period of activePeriods) {
      // Last write wins if multiple active periods exist (safety guard)
      amountByItemId.set(period.itemId, period.amount);
    }

    return accounts.map((a) => {
      const latest = getLatestBalance(a.balances);
      const linkedItems = a.linkedItems.map((item) => ({
        ...item,
        amount: amountByItemId.get(item.id) ?? 0,
      }));
      const monthlyContribution = linkedItems.reduce(
        (sum, item) => sum + toMonthlyAmount(item.amount, item.spendType),
        0
      );
      return {
        ...a,
        currentBalance: latest?.value ?? 0,
        currentBalanceDate: latest?.date ?? null,
        linkedItems,
        monthlyContribution,
      };
    });
  },

  async createAccount(householdId: string, data: CreateAccountInput, ctx: ActorCtx) {
    if (data.memberId) {
      await assertMemberInHousehold(householdId, data.memberId);
    }
    const resolved = await resolveDisposalPatch(
      householdId,
      { disposedAt: data.disposedAt, disposalAccountId: data.disposalAccountId },
      null
    );
    const {
      initialValue,
      disposedAt: _ignoredDate,
      disposalAccountId: _ignoredAcct,
      ...accountData
    } = data;
    void _ignoredDate;
    void _ignoredAcct;
    return audited({
      db: prisma,
      ctx,
      action: "CREATE_ACCOUNT",
      resource: "account",
      resourceId: "",
      beforeFetch: async (_tx) => null,
      mutation: async (tx) => {
        const account = await tx.account.create({
          data: { householdId, ...accountData, ...resolved },
        });
        if (initialValue !== undefined) {
          await tx.accountBalance.create({
            data: {
              accountId: account.id,
              value: initialValue,
              date: new Date(),
            },
          });
        }
        return account;
      },
    });
  },

  async updateAccount(
    householdId: string,
    accountId: string,
    data: UpdateAccountInput,
    ctx: ActorCtx
  ) {
    await assertAccountOwned(householdId, accountId);
    if (data.memberId) {
      await assertMemberInHousehold(householdId, data.memberId);
    }
    const resolved = await resolveDisposalPatch(
      householdId,
      { disposedAt: data.disposedAt, disposalAccountId: data.disposalAccountId },
      accountId
    );
    const { disposedAt: _ignoredDate, disposalAccountId: _ignoredAcct, ...rest } = data;
    void _ignoredDate;
    void _ignoredAcct;
    return audited({
      db: prisma,
      ctx,
      action: "UPDATE_ACCOUNT",
      resource: "account",
      resourceId: accountId,
      beforeFetch: async (tx) =>
        tx.account.findUnique({ where: { id: accountId } }) as Promise<Record<
          string,
          unknown
        > | null>,
      mutation: async (tx) =>
        tx.account.update({ where: { id: accountId }, data: { ...rest, ...resolved } }),
    });
  },

  async deleteAccount(householdId: string, accountId: string, ctx: ActorCtx) {
    await assertAccountOwned(householdId, accountId);
    return audited({
      db: prisma,
      ctx,
      action: "DELETE_ACCOUNT",
      resource: "account",
      resourceId: accountId,
      beforeFetch: async (tx) =>
        tx.account.findUnique({ where: { id: accountId } }) as Promise<Record<
          string,
          unknown
        > | null>,
      mutation: async (tx) => tx.account.delete({ where: { id: accountId } }),
    });
  },

  async recordAccountBalance(
    householdId: string,
    accountId: string,
    data: RecordAccountBalanceInput,
    ctx: ActorCtx
  ) {
    await assertAccountOwned(householdId, accountId);
    return audited({
      db: prisma,
      ctx,
      action: "RECORD_ACCOUNT_BALANCE",
      resource: "account-balance",
      resourceId: accountId,
      beforeFetch: async (_tx) => null,
      mutation: async (tx) => {
        const balance = await tx.accountBalance.create({
          data: {
            accountId,
            value: data.value,
            date: new Date(data.date),
            note: data.note ?? null,
          },
        });
        await tx.account.update({
          where: { id: accountId },
          data: { lastReviewedAt: new Date() },
        });
        return balance;
      },
    });
  },

  async confirmAccount(householdId: string, accountId: string, ctx: ActorCtx) {
    await assertAccountOwned(householdId, accountId);
    return audited({
      db: prisma,
      ctx,
      action: "CONFIRM_ACCOUNT",
      resource: "account",
      resourceId: accountId,
      beforeFetch: async (_tx) => null,
      mutation: async (tx) =>
        tx.account.update({
          where: { id: accountId },
          data: { lastReviewedAt: new Date() },
        }),
    });
  },
};
