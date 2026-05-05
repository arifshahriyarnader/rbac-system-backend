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

export const getUserById = async (
  userId: string,
  caller: {
    id: string;
    role: string;
  },
) => {
  const userResult = await databaseConnection.query<UserRow>(
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
     WHERE u.id = $1`,
    [userId],
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (caller.role === "manager") {
    const scopeCheck = await databaseConnection.query(
      `SELECT id FROM users
       WHERE id = $1
       AND manager_id = $2`,
      [userId, caller.id],
    );

    if (scopeCheck.rows.length === 0) {
      throw new ApiError(403, "Access denied — this user is not in your team");
    }
  }

  const permissionsResult = await databaseConnection.query(
    `SELECT DISTINCT p.atom
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u ON u.role_id = rp.role_id
     LEFT JOIN user_permissions up
       ON up.permission_id = p.id
       AND up.user_id = $1
     WHERE u.id = $1
     AND COALESCE(up.granted, true) = true`,
    [userId],
  );

  const permissions = permissionsResult.rows.map(
    (row: { atom: string }) => row.atom,
  );

  return {
    ...user,
    permissions,
  };
};
