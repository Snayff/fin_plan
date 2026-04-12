import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { giftsApi } from "@/services/gifts.service";

export const GIFTS_KEYS = {
  all: ["gifts"] as const,
  state: (year: number) => ["gifts", "state", year] as const,
  person: (id: string, year: number) => ["gifts", "person", id, year] as const,
  upcoming: (year: number) => ["gifts", "upcoming", year] as const,
  years: () => ["gifts", "years"] as const,
  configPeople: (filter: string) => ["gifts", "configPeople", filter] as const,
  configEvents: () => ["gifts", "configEvents"] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGiftsState(year: number) {
  return useQuery({
    queryKey: GIFTS_KEYS.state(year),
    queryFn: () => giftsApi.getState(year),
  });
}

export function useGiftPerson(id: string, year: number) {
  return useQuery({
    queryKey: GIFTS_KEYS.person(id, year),
    queryFn: () => giftsApi.getPerson(id, year),
    enabled: !!id,
  });
}

export function useGiftsUpcoming(year: number) {
  return useQuery({
    queryKey: GIFTS_KEYS.upcoming(year),
    queryFn: () => giftsApi.getUpcoming(year),
  });
}

export function useGiftsYears() {
  return useQuery({
    queryKey: GIFTS_KEYS.years(),
    queryFn: () => giftsApi.listYears(),
  });
}

export function useConfigPeople(filter: "all" | "household" | "non-household") {
  return useQuery({
    queryKey: GIFTS_KEYS.configPeople(filter),
    queryFn: () => giftsApi.listConfigPeople(filter),
  });
}

export function useConfigEvents() {
  return useQuery({
    queryKey: GIFTS_KEYS.configEvents(),
    queryFn: () => giftsApi.listConfigEvents(),
  });
}

// ─── Person Mutations ─────────────────────────────────────────────────────────

export function useCreateGiftPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof giftsApi.createPerson>[0]) => giftsApi.createPerson(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

export function useUpdateGiftPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof giftsApi.updatePerson>[1] }) =>
      giftsApi.updatePerson(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

export function useDeleteGiftPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => giftsApi.deletePerson(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

// ─── Event Mutations ──────────────────────────────────────────────────────────

export function useCreateGiftEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof giftsApi.createEvent>[0]) => giftsApi.createEvent(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

export function useUpdateGiftEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof giftsApi.updateEvent>[1] }) =>
      giftsApi.updateEvent(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

export function useDeleteGiftEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => giftsApi.deleteEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

// ─── Allocation Mutations ─────────────────────────────────────────────────────

export function useUpsertAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      eventId,
      year,
      data,
    }: {
      personId: string;
      eventId: string;
      year: number;
      data: Parameters<typeof giftsApi.upsertAllocation>[3];
    }) => giftsApi.upsertAllocation(personId, eventId, year, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

export function useBulkUpsertAllocations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof giftsApi.bulkUpsert>[0]) => giftsApi.bulkUpsert(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

// ─── Budget & Mode Mutations ──────────────────────────────────────────────────

export function useSetGiftBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      year,
      data,
    }: {
      year: number;
      data: Parameters<typeof giftsApi.setBudget>[1];
    }) => giftsApi.setBudget(year, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

export function useSetGiftMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof giftsApi.setMode>[0]) => giftsApi.setMode(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}

// ─── Rollover ─────────────────────────────────────────────────────────────────

export function useDismissRollover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year: number) => giftsApi.dismissRollover(year),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GIFTS_KEYS.all });
    },
  });
}
