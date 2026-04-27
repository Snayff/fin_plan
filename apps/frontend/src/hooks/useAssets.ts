import { useQueries, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApiService, type AccountItem } from "../services/assets.service.js";
import type { AssetType, AccountType } from "@finplan/shared";
import { ISA_ALLOWANCE_KEY } from "./useIsaAllowance.js";

const ALL_ACCOUNT_TYPES: AccountType[] = [
  "Current",
  "Savings",
  "Pension",
  "StocksAndShares",
  "Other",
];

export const ASSETS_QUERY_KEYS = {
  summary: ["assets", "summary"] as const,
  assetsByType: (type: AssetType, includeDisposed = false) =>
    ["assets", "assets", type, includeDisposed ? "all" : "active"] as const,
  accountsByType: (type: AccountType, includeDisposed = false) =>
    ["assets", "accounts", type, includeDisposed ? "all" : "active"] as const,
};

export function useAssetsSummary() {
  return useQuery({
    queryKey: ASSETS_QUERY_KEYS.summary,
    queryFn: assetsApiService.getSummary,
  });
}

export function useAssetsByType(type: AssetType, opts: { includeDisposed?: boolean } = {}) {
  return useQuery({
    queryKey: ASSETS_QUERY_KEYS.assetsByType(type, opts.includeDisposed),
    queryFn: () => assetsApiService.listAssetsByType(type, opts),
  });
}

export function useAccountsByType(type: AccountType, opts: { includeDisposed?: boolean } = {}) {
  return useQuery({
    queryKey: ASSETS_QUERY_KEYS.accountsByType(type, opts.includeDisposed),
    queryFn: () => assetsApiService.listAccountsByType(type, opts),
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.createAsset,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: Parameters<typeof assetsApiService.updateAsset>[1];
    }) => assetsApiService.updateAsset(assetId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.deleteAsset,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}

export function useRecordAssetBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: Parameters<typeof assetsApiService.recordAssetBalance>[1];
    }) => assetsApiService.recordAssetBalance(assetId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.createAccount,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
      void qc.invalidateQueries({ queryKey: ISA_ALLOWANCE_KEY });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: Parameters<typeof assetsApiService.updateAccount>[1];
    }) => assetsApiService.updateAccount(accountId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
      void qc.invalidateQueries({ queryKey: ISA_ALLOWANCE_KEY });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.deleteAccount,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
      void qc.invalidateQueries({ queryKey: ISA_ALLOWANCE_KEY });
    },
  });
}

export function useRecordAccountBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: Parameters<typeof assetsApiService.recordAccountBalance>[1];
    }) => assetsApiService.recordAccountBalance(accountId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}

export function useConfirmAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.confirmAsset,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}

/**
 * Fetch every active account across all types, flattened. Used by disposal-target
 * pickers (asset/account form "Proceeds go to" select).
 */
export function useAllAccounts(): { data: AccountItem[]; isLoading: boolean } {
  const queries = useQueries({
    queries: ALL_ACCOUNT_TYPES.map((type) => ({
      queryKey: ASSETS_QUERY_KEYS.accountsByType(type),
      queryFn: () => assetsApiService.listAccountsByType(type),
    })),
  });
  const isLoading = queries.some((q) => q.isLoading);
  const data = queries.flatMap((q) => q.data ?? []);
  return { data, isLoading };
}

export function useConfirmAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.confirmAccount,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assets"] });
      void qc.invalidateQueries({ queryKey: ["forecast"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "shortfall"] });
    },
  });
}
