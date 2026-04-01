import { apiClient } from "@/lib/api";
import type { ForecastProjection, ForecastHorizon } from "@finplan/shared";

export const forecastService = {
  getProjections: (horizonYears: ForecastHorizon) =>
    apiClient.get<ForecastProjection>(`/api/forecast?horizonYears=${horizonYears}`),
};
