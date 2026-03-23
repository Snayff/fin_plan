import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { setupSessionService } from "@/services/setup-session.service";

export function useSetupSession() {
  return useQuery({
    queryKey: ["setup-session"],
    queryFn: setupSessionService.getSession,
  });
}

export function useCreateSetupSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setupSessionService.createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["setup-session"] });
    },
  });
}

export function useUpdateSetupSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { currentStep: number }) => setupSessionService.updateSession(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["setup-session"] });
    },
  });
}

export function useDeleteSetupSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setupSessionService.deleteSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["setup-session"] });
    },
  });
}
