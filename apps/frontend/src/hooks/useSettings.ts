import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { snapshotService } from "@/services/snapshot.service";
import { householdService } from "@/services/household.service";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import type { UpdateSettingsInput, AuditLogQuery } from "@finplan/shared";
import { fetchAuditLog, updateMemberRole } from "@/services/auditLog.service";

export const SETTINGS_KEYS = {
  settings: ["settings"] as const,
  snapshots: ["snapshots"] as const,
  snapshot: (id: string) => ["snapshots", id] as const,
  household: (id: string) => ["household", id] as const,
  members: (id: string) => ["household", id, "members"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEYS.settings,
    queryFn: settingsService.getSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsInput) => settingsService.updateSettings(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.settings });
    },
  });
}

export function useSnapshots() {
  return useQuery({
    queryKey: SETTINGS_KEYS.snapshots,
    queryFn: snapshotService.listSnapshots,
  });
}

export function useSnapshot(id: string | null) {
  return useQuery({
    queryKey: SETTINGS_KEYS.snapshot(id ?? ""),
    queryFn: () => snapshotService.getSnapshot(id!),
    enabled: !!id,
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => snapshotService.createSnapshot({ name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.snapshots });
    },
  });
}

export function useRenameSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      snapshotService.renameSnapshot(id, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.snapshots });
    },
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => snapshotService.deleteSnapshot(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.snapshots });
    },
  });
}

export function useHouseholdDetails(householdId: string) {
  return useQuery({
    queryKey: SETTINGS_KEYS.household(householdId),
    queryFn: () => householdService.getHouseholdDetails(householdId),
    enabled: !!householdId,
  });
}

export function useRenameHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      householdService.renameHousehold(id, name),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.household(id) });
      void queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, email }: { householdId: string; email: string }) =>
      householdService.inviteMember(householdId, email),
    onSuccess: (_data, { householdId }) => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.household(householdId) });
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, inviteId }: { householdId: string; inviteId: string }) =>
      householdService.cancelInvite(householdId, inviteId),
    onSuccess: (_data, { householdId }) => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.household(householdId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string }) =>
      householdService.removeMember(householdId, memberId),
    onSuccess: (_data, { householdId }) => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.household(householdId) });
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (householdId: string) => householdService.leaveHousehold(householdId),
    onSuccess: async (_data, householdId) => {
      const { user } = await authService.getCurrentUser(accessToken!);
      setUser(user, accessToken!);
      void queryClient.invalidateQueries({ queryKey: ["households"] });
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.household(householdId) });
    },
  });
}

export function useAuditLog(filters: Omit<AuditLogQuery, "cursor" | "limit">) {
  return useInfiniteQuery({
    queryKey: ["audit-log", filters],
    queryFn: ({ pageParam }) =>
      fetchAuditLog({
        ...filters,
        cursor: pageParam as string | undefined,
        limit: 50,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useHouseholdMembers() {
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";
  const { data } = useHouseholdDetails(householdId);
  const members = data?.household?.memberProfiles ?? [];
  return {
    data: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      firstName: m.name.split(" ")[0] ?? m.name,
      name: m.name,
      role: m.role,
    })),
  };
}

export function useUpdateMemberRole(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUserId, role }: { targetUserId: string; role: "member" | "admin" }) =>
      updateMemberRole(targetUserId, role, householdId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["household-members"] });
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.household(householdId) });
    },
  });
}
