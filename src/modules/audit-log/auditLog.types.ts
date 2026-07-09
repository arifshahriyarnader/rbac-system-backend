export interface AuditLogRow {
  id: string;
  actor_id: string;
  actor_name: string;
  target_id: string | null;
  target_name: string | null;
  action: string;
  module: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: Date;
}

export interface AuditLogFilters {
  userId?: string;
  module?: string;
  action?: string;
  page?: number;
  limit?: number;
}
