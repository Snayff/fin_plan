import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plannerService } from "@/services/planner.service";
import { waterfallService } from "@/services/waterfall.service";

export const PLANNER_KEYS = {
  purchases: (year: number) => ["planner", "purchases", year],
  giftPersons: (year: number) => ["planner", "giftPersons", year],
  giftPerson: (id: string, year: number) => ["planner", "giftPerson", id, year],
  upcoming: (year: number) => ["planner", "upcoming", year],
  budget: (year: number) => ["planner", "budget", year],
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function usePurchases(year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.purchases(year),
    queryFn: () => plannerService.listPurchases(year),
  });
}

export function useGiftPersons(year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.giftPersons(year),
    queryFn: () => plannerService.listGiftPersons(year),
  });
}

export function useGiftPerson(id: string, year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.giftPerson(id, year),
    queryFn: () => plannerService.getGiftPerson(id, year),
    enabled: !!id,
  });
}

export function useUpcomingGifts(year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.upcoming(year),
    queryFn: () => plannerService.getUpcomingGifts(year),
  });
}

export function useYearBudget(year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.budget(year),
    queryFn: () => waterfallService.getYearBudget(year),
  });
}

// ─── Purchase Mutations ───────────────────────────────────────────────────────

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof plannerService.createPurchase>[0]) =>
      plannerService.createPurchase(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "purchases"] });
    },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof plannerService.updatePurchase>[1];
    }) => plannerService.updatePurchase(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "purchases"] });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plannerService.deletePurchase(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "purchases"] });
    },
  });
}

// ─── Budget Mutation ──────────────────────────────────────────────────────────

export function useUpsertBudget(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof waterfallService.upsertYearBudget>[1]) =>
      waterfallService.upsertYearBudget(year, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLANNER_KEYS.budget(year) });
    },
  });
}

// ─── Gift Person Mutations ────────────────────────────────────────────────────

export function useCreateGiftPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof plannerService.createGiftPerson>[0]) =>
      plannerService.createGiftPerson(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
    },
  });
}

export function useUpdateGiftPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof plannerService.updateGiftPerson>[1];
    }) => plannerService.updateGiftPerson(id, data),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPerson", id] });
    },
  });
}

export function useDeleteGiftPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plannerService.deleteGiftPerson(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
    },
  });
}

// ─── Gift Event Mutations ─────────────────────────────────────────────────────

export function useCreateGiftEvent(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      data,
    }: {
      personId: string;
      data: Parameters<typeof plannerService.createGiftEvent>[1];
    }) => plannerService.createGiftEvent(personId, data),
    onSuccess: (_data, { personId }) => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPerson", personId] });
      void queryClient.invalidateQueries({ queryKey: PLANNER_KEYS.upcoming(year) });
    },
  });
}

export function useUpdateGiftEvent(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof plannerService.updateGiftEvent>[1];
    }) => plannerService.updateGiftEvent(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPerson"] });
      void queryClient.invalidateQueries({ queryKey: PLANNER_KEYS.upcoming(year) });
    },
  });
}

export function useDeleteGiftEvent(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plannerService.deleteGiftEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPerson"] });
      void queryClient.invalidateQueries({ queryKey: PLANNER_KEYS.upcoming(year) });
    },
  });
}

// ─── Gift Year Record Mutation ────────────────────────────────────────────────

export function useUpsertGiftYearRecord(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: Parameters<typeof plannerService.upsertGiftYearRecord>[2];
    }) => plannerService.upsertGiftYearRecord(eventId, year, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPersons"] });
      void queryClient.invalidateQueries({ queryKey: ["planner", "giftPerson"] });
      void queryClient.invalidateQueries({ queryKey: PLANNER_KEYS.upcoming(year) });
    },
  });
}
