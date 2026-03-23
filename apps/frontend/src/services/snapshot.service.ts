import { apiClient } from "@/lib/api";
import type { CreateSnapshotInput, RenameSnapshotInput } from "@finplan/shared";

export const snapshotService = {
  listSnapshots: () => apiClient.get<any[]>("/api/snapshots"),
  getSnapshot: (id: string) => apiClient.get<any>(`/api/snapshots/${id}`),
  createSnapshot: (data: CreateSnapshotInput) => apiClient.post<any>("/api/snapshots", data),
  renameSnapshot: (id: string, data: RenameSnapshotInput) =>
    apiClient.patch<any>(`/api/snapshots/${id}`, data),
  deleteSnapshot: (id: string) => apiClient.delete<void>(`/api/snapshots/${id}`),
};
