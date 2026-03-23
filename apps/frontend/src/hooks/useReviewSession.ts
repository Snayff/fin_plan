import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewSessionService } from "@/services/review-session.service";
import { waterfallService } from "@/services/waterfall.service";

// ─── Session hooks ─────────────────────────────────────────────────────────────

export function useReviewSession() {
  return useQuery({
    queryKey: ["review-session"],
    queryFn: reviewSessionService.getSession,
  });
}

export function useCreateReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reviewSessionService.createSession(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-session"] });
    },
  });
}

export function useUpdateReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reviewSessionService.updateSession>[0]) =>
      reviewSessionService.updateSession(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-session"] });
    },
  });
}

export function useDeleteReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reviewSessionService.deleteSession(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["review-session"] });
    },
  });
}

// ─── Step data hooks ───────────────────────────────────────────────────────────

export function useReviewIncome() {
  return useQuery({
    queryKey: ["waterfall", "income"],
    queryFn: waterfallService.listIncome,
  });
}

export function useReviewCommitted() {
  return useQuery({
    queryKey: ["waterfall", "committed"],
    queryFn: waterfallService.listCommitted,
  });
}

export function useReviewYearly() {
  return useQuery({
    queryKey: ["waterfall", "yearly"],
    queryFn: waterfallService.listYearly,
  });
}

export function useReviewDiscretionary() {
  return useQuery({
    queryKey: ["waterfall", "discretionary"],
    queryFn: waterfallService.listDiscretionary,
  });
}

export function useReviewSavings() {
  return useQuery({
    queryKey: ["waterfall", "savings"],
    queryFn: waterfallService.listSavings,
  });
}
