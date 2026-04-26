import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cashflowService } from "@/services/cashflow.service";
import type { CashflowProjectionQuery, BulkUpdateLinkedAccountsInput } from "@finplan/shared";
import { showError } from "@/lib/toast";

export const CASHFLOW_KEYS = {
  projection: (q: CashflowProjectionQuery) => ["cashflow", "projection", q] as const,
  month: (year: number, month: number) => ["cashflow", "month", year, month] as const,
  linkable: ["cashflow", "linkable-accounts"] as const,
};

export function useCashflowProjection(query: CashflowProjectionQuery = { monthCount: 12 }) {
  return useQuery({
    queryKey: CASHFLOW_KEYS.projection(query),
    queryFn: () => cashflowService.getProjection(query),
  });
}

export function useCashflowMonth(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: CASHFLOW_KEYS.month(year, month),
    queryFn: () => cashflowService.getMonthDetail(year, month),
    enabled,
  });
}

export function useLinkableAccounts() {
  return useQuery({
    queryKey: CASHFLOW_KEYS.linkable,
    queryFn: () => cashflowService.listLinkableAccounts(),
  });
}

export function useUpdateLinkedAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      isCashflowLinked,
    }: {
      accountId: string;
      isCashflowLinked: boolean;
    }) => cashflowService.updateLinkedAccount(accountId, isCashflowLinked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CASHFLOW_KEYS.linkable });
      void qc.invalidateQueries({ queryKey: ["cashflow", "projection"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "month"] });
    },
    onError: (err: Error) => {
      showError(err.message ?? "Failed to update linked account");
    },
  });
}

export function useBulkUpdateLinkedAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkUpdateLinkedAccountsInput) =>
      cashflowService.bulkUpdateLinkedAccounts(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CASHFLOW_KEYS.linkable });
      void qc.invalidateQueries({ queryKey: ["cashflow", "projection"] });
      void qc.invalidateQueries({ queryKey: ["cashflow", "month"] });
    },
    onError: (err: Error) => {
      showError(err.message ?? "Failed to update linked accounts");
    },
  });
}
