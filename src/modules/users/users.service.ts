import { databaseConnection } from "../../database/connection";
import { ApiError } from "../../utlis/ApiError";
import { UserRow } from "./users.types";

export const getAllUsers = async (caller: { id: string; role: string }) => {
  if (caller.role === "admin") {
    const result = await databaseConnection.query<UserRow>(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.status,
        u.last_login,
        u.created_at,
        r.name        AS role,
        m.name        AS manager,
        cb.name       AS created_by
       FROM users u
       JOIN roles r         ON r.id  = u.role_id
       LEFT JOIN users m    ON m.id  = u.manager_id
       LEFT JOIN users cb   ON cb.id = u.created_by
       ORDER BY u.created_at DESC`,
    );

    return result.rows;
  }

  if (caller.role === "manager") {
    const result = await databaseConnection.query<UserRow>(
      `SELECT
      u.id,
      u.name,
      u.email,
      u.status,
      u.last_login,
      u.created_at,
      r.name        AS role,
      m.name        AS manager,
      cb.name       AS created_by
     FROM users u
     JOIN roles r         ON r.id  = u.role_id
     LEFT JOIN users m    ON m.id  = u.manager_id
     LEFT JOIN users cb   ON cb.id = u.created_by
     WHERE u.manager_id = $1
     ORDER BY u.created_at DESC`,
      [caller.id],
    );
    return result.rows;
  }

  throw new ApiError(403, "You do not have permission to view users");
};
