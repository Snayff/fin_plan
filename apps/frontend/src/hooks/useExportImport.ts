import { useMutation, useQueryClient } from "@tanstack/react-query";
import { householdService } from "@/services/household.service";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";

const safeName = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "household";

export function useExportHousehold() {
  return useMutation({
    mutationFn: (householdId: string) => householdService.exportHousehold(householdId),
    onSuccess: (data) => {
      const envelope = data as { household?: { name?: string } } | null;
      const name = envelope?.household?.name ?? "household";
      const date = new Date().toISOString().split("T")[0];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finplan-export-${safeName(name)}-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useImportHousehold() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: ({
      householdId,
      data,
      mode,
    }: {
      householdId: string;
      data: unknown;
      mode: "overwrite" | "create_new";
    }) => householdService.importHousehold(householdId, data, mode),
    onSuccess: async () => {
      if (accessToken) {
        const { user } = await authService.getCurrentUser(accessToken);
        setUser(user, accessToken);
      }
      void queryClient.invalidateQueries();
    },
  });
}

export function useValidateImport() {
  return useMutation({
    mutationFn: (data: unknown) => householdService.validateImport(data),
  });
}
