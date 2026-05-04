import { apiClient } from "@/lib/api";
import type { SecurityActivityResponse } from "@finplan/shared";

export async function fetchSecurityActivity(params: {
  cursor?: string;
  limit?: number;
}): Promise<SecurityActivityResponse> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiClient.get<SecurityActivityResponse>(`/api/security-activity${qs ? `?${qs}` : ""}`);
}
