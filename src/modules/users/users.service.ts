import bcrypt from "bcrypt";
import { databaseConnection } from "../../database/connection";
import { ApiError } from "../../utlis/ApiError";
import { CreatedUserRow, UserRow } from "./users.types";
import { CreateUserInput } from "./validators/createUser.validator";

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

export const createUser = async (
  data: CreateUserInput,
  caller: {
    id: string;
    role: string;
  },
) => {
  const { name, email, password, role, managerId } = data;

  if (caller.role === "manager" && role === "manager") {
    throw new ApiError(403, "Managers can only create agents or customers");
  }

  let assignedManagerId: string | null = null;
  if (caller.role === "admin") {
    if (role === "manager") {
      assignedManagerId = null;
    } else {
      if (!managerId) {
        throw new ApiError(
          400,
          "managerId is required when creating agent or customer",
        );
      }

      const managerCheck = await databaseConnection.query(
        `SELECT u.id
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1
         AND r.name = 'manager'
         AND u.status = 'active'`,
        [managerId],
      );

      if (managerCheck.rows.length === 0) {
        throw new ApiError(
          404,
          "Manager not found or is not an active manager",
        );
      }

      assignedManagerId = managerId;
    }
  } else if (caller.role === "manager") {
    assignedManagerId = caller.id;
  }

  const existingUser = await databaseConnection.query(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new ApiError(409, "Email already exists");
  }

  const roleResult = await databaseConnection.query(
    `SELECT id FROM roles WHERE name = $1`,
    [role],
  );

  const roleRow = roleResult.rows[0];

  if (!roleRow) {
    throw new ApiError(400, "Invalid role specified");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUserResult = await databaseConnection.query<CreatedUserRow>(
    `INSERT INTO users (
      name,
      email,
      password_hash,
      role_id,
      manager_id,
      created_by,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
    RETURNING
      id,
      name,
      email,
      status,
      created_at`,
    [name, email, passwordHash, roleRow.id, assignedManagerId, caller.id],
  );

  const newUser = newUserResult.rows[0];

  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, target_id, action, module, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      caller.id,
      newUser.id,
      "user.created",
      "users",
      JSON.stringify({
        name,
        email,
        role,
        assignedManagerId,
      }),
    ],
  );

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: role,
    status: newUser.status,
    managerId: assignedManagerId,
    created_at: newUser.created_at,
  };
};
