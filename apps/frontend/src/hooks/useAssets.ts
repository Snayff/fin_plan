import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApiService } from "../services/assets.service.js";
import type { AssetType, AccountType } from "@finplan/shared";

export const ASSETS_QUERY_KEYS = {
  summary: ["assets", "summary"] as const,
  assetsByType: (type: AssetType) => ["assets", "assets", type] as const,
  accountsByType: (type: AccountType) => ["assets", "accounts", type] as const,
};

export function useAssetsSummary() {
  return useQuery({
    queryKey: ASSETS_QUERY_KEYS.summary,
    queryFn: assetsApiService.getSummary,
  });
}

export function useAssetsByType(type: AssetType) {
  return useQuery({
    queryKey: ASSETS_QUERY_KEYS.assetsByType(type),
    queryFn: () => assetsApiService.listAssetsByType(type),
  });
}

export function useAccountsByType(type: AccountType) {
  return useQuery({
    queryKey: ASSETS_QUERY_KEYS.accountsByType(type),
    queryFn: () => assetsApiService.listAccountsByType(type),
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.createAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
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
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.deleteAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
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
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
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
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.deleteAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
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
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useConfirmAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.confirmAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useConfirmAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetsApiService.confirmAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
