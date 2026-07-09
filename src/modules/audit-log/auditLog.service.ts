import { databaseConnection } from "../../database/connection";
import { ApiError } from "../../utlis/ApiError";
import { AuditLogRow, AuditLogFilters } from "./auditLog.types";

export const getAuditLogs = async (
  filters: AuditLogFilters,
  caller: { id: string; role: string },
) => {
  if (caller.role !== "admin" && caller.role !== "manager") {
    throw new ApiError(
      403,
      "Access denied — only admin and manager can view audit logs",
    );
  }

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters.userId) {
    conditions.push(
      `(al.actor_id = $${paramIndex} OR al.target_id = $${paramIndex})`,
    );
    values.push(filters.userId);
    paramIndex++;
  }

  if (filters.module) {
    conditions.push(`al.module = $${paramIndex}`);
    values.push(filters.module);
    paramIndex++;
  }

  if (filters.action) {
    conditions.push(`al.action = $${paramIndex}`);
    values.push(filters.action);
    paramIndex++;
  }

  if (caller.role === "manager") {
    conditions.push(
      `(al.actor_id = $${paramIndex}
        OR al.target_id IN (
          SELECT id FROM users WHERE manager_id = $${paramIndex}
        )
        OR al.actor_id IN (
          SELECT id FROM users WHERE manager_id = $${paramIndex}
        )
       )`,
    );
    values.push(caller.id);
    paramIndex++;
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await databaseConnection.query(
    `SELECT COUNT(*) as total
     FROM audit_logs al
     ${whereClause}`,
    values,
  );

  const total = parseInt(countResult.rows[0].total);

  const logsResult = await databaseConnection.query<AuditLogRow>(
    `SELECT
      al.id,
      al.action,
      al.module,
      al.metadata,
      al.ip_address,
      al.created_at,
      actor.id    AS actor_id,
      actor.name  AS actor_name,
      target.id   AS target_id,
      target.name AS target_name
     FROM audit_logs al
     JOIN  users actor  ON actor.id  = al.actor_id
     LEFT JOIN users target ON target.id = al.target_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT  $${paramIndex}
     OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  );

  return {
    logs: logsResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};
