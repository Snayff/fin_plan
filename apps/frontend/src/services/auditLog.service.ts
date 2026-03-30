import { apiClient } from "@/lib/api";
import type { AuditLogQuery, AuditLogResponse } from "@finplan/shared";

export async function fetchAuditLog(
  params: Omit<AuditLogQuery, "limit"> & { cursor?: string; limit?: number }
): Promise<AuditLogResponse> {
  const query = new URLSearchParams();
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.resource) query.set("resource", params.resource);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient.get<AuditLogResponse>(`/api/audit-log${qs ? `?${qs}` : ""}`);
}

export async function updateMemberRole(
  targetUserId: string,
  role: "member" | "admin",
  householdId: string
): Promise<{ success: boolean }> {
  return apiClient.patch<{ success: boolean }>(
    `/api/households/${householdId}/members/${targetUserId}/role`,
    { role }
  );
}
