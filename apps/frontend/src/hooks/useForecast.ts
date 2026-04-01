import { useQuery } from "@tanstack/react-query";
import { forecastService } from "@/services/forecast.service";
import type { ForecastHorizon } from "@finplan/shared";

export const FORECAST_KEYS = {
  projections: (horizonYears: ForecastHorizon) => ["forecast", horizonYears] as const,
};

export function useForecast(horizonYears: ForecastHorizon) {
  return useQuery({
    queryKey: FORECAST_KEYS.projections(horizonYears),
    queryFn: () => forecastService.getProjections(horizonYears),
  });
}
