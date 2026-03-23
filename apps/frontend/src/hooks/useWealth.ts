import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wealthService } from "@/services/wealth.service";

export const WEALTH_KEYS = {
  summary: ["wealth", "summary"] as const,
  accounts: ["wealth", "accounts"] as const,
  account: (id: string) => ["wealth", "account", id] as const,
  history: (id: string) => ["wealth", "history", id] as const,
  isa: ["wealth", "isa"] as const,
};

export function useWealthSummary() {
  return useQuery({
    queryKey: WEALTH_KEYS.summary,
    queryFn: wealthService.getSummary,
  });
}

export function useWealthAccounts() {
  return useQuery({
    queryKey: WEALTH_KEYS.accounts,
    queryFn: wealthService.listAccounts,
  });
}

export function useWealthAccount(id: string) {
  return useQuery({
    queryKey: WEALTH_KEYS.account(id),
    queryFn: () => wealthService.getAccount(id),
    enabled: !!id,
  });
}

export function useAccountHistory(id: string) {
  return useQuery({
    queryKey: WEALTH_KEYS.history(id),
    queryFn: () => wealthService.getHistory(id),
    enabled: !!id,
  });
}

export function useIsaAllowance() {
  return useQuery({
    queryKey: WEALTH_KEYS.isa,
    queryFn: wealthService.getIsaAllowance,
  });
}

export function useUpdateValuation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof wealthService.updateValuation>[1];
    }) => wealthService.updateValuation(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.summary });
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.accounts });
    },
  });
}

export function useConfirmAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wealthService.confirmAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.summary });
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.accounts });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof wealthService.updateAccount>[1];
    }) => wealthService.updateAccount(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.accounts });
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof wealthService.createAccount>[0]) =>
      wealthService.createAccount(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.accounts });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wealthService.deleteAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WEALTH_KEYS.accounts });
    },
  });
}
