import { prisma } from "../config/database.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
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

async function assertMemberOwned(householdId: string, memberUserId: string) {
  const member = await prisma.member.findFirst({
    where: { householdId, userId: memberUserId },
  });
  if (!member) {
    throw new ValidationError("Member not found in household");
  }
}

const ASSET_TYPES: AssetType[] = ["Property", "Vehicle", "Other"];
const ACCOUNT_TYPES: AccountType[] = ["Savings", "Pension", "StocksAndShares", "Other"];

// ── Summary ───────────────────────────────────────────────────────────────────

export const assetsService = {
  async getSummary(householdId: string) {
    const [assets, accounts] = await Promise.all([
      prisma.asset.findMany({
        where: { householdId },
        include: { balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] } },
      }),
      prisma.account.findMany({
        where: { householdId },
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

  async listAssetsByType(householdId: string, type: AssetType) {
    const assets = await prisma.asset.findMany({
      where: { householdId, type },
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
    if (data.memberUserId) {
      await assertMemberOwned(householdId, data.memberUserId);
    }
    return audited({
      db: prisma,
      ctx,
      action: "CREATE_ASSET",
      resource: "asset",
      resourceId: "",
      beforeFetch: async () => null,
      mutation: async (tx) =>
        tx.asset.create({
          data: { householdId, ...data },
        }),
    });
  },

  async updateAsset(householdId: string, assetId: string, data: UpdateAssetInput, ctx: ActorCtx) {
    await assertAssetOwned(householdId, assetId);
    if (data.memberUserId) {
      await assertMemberOwned(householdId, data.memberUserId);
    }
    return audited({
      db: prisma,
      ctx,
      action: "UPDATE_ASSET",
      resource: "asset",
      resourceId: assetId,
      beforeFetch: async (tx) =>
        tx.asset.findUnique({ where: { id: assetId } }) as Promise<Record<string, unknown> | null>,
      mutation: async (tx) => tx.asset.update({ where: { id: assetId }, data }),
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

  async listAccountsByType(householdId: string, type: AccountType) {
    const accounts = await prisma.account.findMany({
      where: { householdId, type },
      include: {
        balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
      },
      orderBy: { createdAt: "asc" },
    });

    return accounts.map((a) => {
      const latest = getLatestBalance(a.balances);
      return {
        ...a,
        currentBalance: latest?.value ?? 0,
        currentBalanceDate: latest?.date ?? null,
      };
    });
  },

  async createAccount(householdId: string, data: CreateAccountInput, ctx: ActorCtx) {
    if (data.memberUserId) {
      await assertMemberOwned(householdId, data.memberUserId);
    }
    return audited({
      db: prisma,
      ctx,
      action: "CREATE_ACCOUNT",
      resource: "account",
      resourceId: "",
      beforeFetch: async (_tx) => null,
      mutation: async (tx) => tx.account.create({ data: { householdId, ...data } }),
    });
  },

  async updateAccount(
    householdId: string,
    accountId: string,
    data: UpdateAccountInput,
    ctx: ActorCtx
  ) {
    await assertAccountOwned(householdId, accountId);
    if (data.memberUserId) {
      await assertMemberOwned(householdId, data.memberUserId);
    }
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
      mutation: async (tx) => tx.account.update({ where: { id: accountId }, data }),
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
