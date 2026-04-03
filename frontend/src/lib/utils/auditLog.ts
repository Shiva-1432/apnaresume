import { apiClient } from "@/lib/api/client";

export interface AuditLogEntry {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  metadata,
}: AuditLogEntry) {
  await apiClient.post("/api/admin/audit", {
    adminId,
    action,
    targetType,
    targetId,
    metadata,
    timestamp: new Date().toISOString(),
  });
}
