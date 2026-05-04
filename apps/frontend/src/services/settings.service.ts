import { apiClient } from "@/lib/api";
import type { UpdateSettingsInput } from "@finplan/shared";

export const settingsService = {
  getSettings: () => apiClient.get<any>("/api/settings"),
  updateSettings: (data: UpdateSettingsInput) => apiClient.patch<any>("/api/settings", data),
  dismissWaterfallTip: () =>
    apiClient.patch<unknown>("/api/settings", { waterfallTipDismissed: true }),
};
