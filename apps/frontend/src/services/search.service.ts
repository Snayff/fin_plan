import { apiClient } from "@/lib/api";
import type { SearchResponse } from "@finplan/shared";

export const searchService = {
  search: (q: string) => apiClient.get<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`),
};
