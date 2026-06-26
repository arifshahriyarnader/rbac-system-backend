import bcrypt from "bcrypt";
import { databaseConnection } from "../../database/connection";
import { ApiError } from "../../utlis/ApiError";
import {
  CreatedUserRow,
  StatusUpdatedUserRow,
  UpdatedUserRow,
  UserRow,
  UserStatus,
} from "./users.types";
import { CreateUserInput } from "./validators/createUser.validator";
import { UpdateUserInput } from "./validators/updateUser.validator";

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

export const updateUser = async (
  userId: string,
  data: UpdateUserInput,
  caller: {
    id: string;
    role: string;
  },
) => {
  const { name, email, password, role, managerId } = data;

  const existingResult = await databaseConnection.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.status,
      u.manager_id,
      r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  );

  const existing = existingResult.rows[0];

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (userId === caller.id) {
    throw new ApiError(400, "You cannot update your own account here");
  }

  if (caller.role === "manager") {
    if (existing.manager_id !== caller.id) {
      throw new ApiError(403, "Access denied — this user is not in your team");
    }

    if (existing.role === "admin" || existing.role === "manager") {
      throw new ApiError(
        403,
        "Managers cannot update admin or manager accounts",
      );
    }

    if (role || managerId) {
      throw new ApiError(
        403,
        "Managers cannot change role or manager assignment",
      );
    }
  }

  if (email && email !== existing.email) {
    const emailCheck = await databaseConnection.query(
      `SELECT id FROM users
       WHERE email = $1
       AND id != $2`,
      [email, userId],
    );

    if (emailCheck.rows.length > 0) {
      throw new ApiError(409, "Email already in use");
    }
  }

  let newRoleId: string | null = null;

  if (role) {
    const roleResult = await databaseConnection.query(
      `SELECT id FROM roles WHERE name = $1`,
      [role],
    );

    if (!roleResult.rows[0]) {
      throw new ApiError(400, "Invalid role specified");
    }

    newRoleId = roleResult.rows[0].id;
  }

  if (managerId) {
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
      throw new ApiError(404, "Manager not found or is not an active manager");
    }
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (name) {
    fields.push(`name = $${paramIndex}`);
    values.push(name);
    paramIndex++;
  }

  if (email) {
    fields.push(`email = $${paramIndex}`);
    values.push(email);
    paramIndex++;
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    fields.push(`password_hash = $${paramIndex}`);
    values.push(passwordHash);
    paramIndex++;
  }

  if (newRoleId) {
    fields.push(`role_id = $${paramIndex}`);
    values.push(newRoleId);
    paramIndex++;
  }

  if (managerId) {
    fields.push(`manager_id = $${paramIndex}`);
    values.push(managerId);
    paramIndex++;
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);
  const updatedResult = await databaseConnection.query<UpdatedUserRow>(
    `UPDATE users
     SET ${fields.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING
       id,
       name,
       email,
       status,
       updated_at`,
    values,
  );

  const updatedUser = updatedResult.rows[0];
  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, target_id, action, module, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      caller.id,
      userId,
      "user.updated",
      "users",
      JSON.stringify({
        old: {
          name: existing.name,
          email: existing.email,
          role: existing.role,
          managerId: existing.manager_id,
        },
        new: {
          name: name ?? existing.name,
          email: email ?? existing.email,
          role: role ?? existing.role,
          managerId: managerId ?? existing.manager_id,
        },
      }),
    ],
  );

  return updatedUser;
};

export const updateUserStatus = async (
  userId: string,
  newStatus: UserStatus,
  caller: {
    id: string;
    role: string;
  },
) => {
  const existingResult = await databaseConnection.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.status,
      u.manager_id,
      r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  );

  const existing = existingResult.rows[0];

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (userId === caller.id) {
    throw new ApiError(400, "You cannot change your own status");
  }

  if (existing.role === "admin") {
    throw new ApiError(403, "Admin status cannot be changed");
  }

  if (caller.role === "manager") {
    if (existing.manager_id !== caller.id) {
      throw new ApiError(403, "Access denied — this user is not in your team");
    }

    if (existing.role === "manager") {
      throw new ApiError(403, "Managers cannot change other manager status");
    }
  }

  if (existing.status === newStatus) {
    throw new ApiError(400, `User is already ${newStatus}`);
  }

  const updatedResult = await databaseConnection.query<StatusUpdatedUserRow>(
    `UPDATE users
     SET
       status     = $1,
       updated_at = NOW()
     WHERE id = $2
     RETURNING
       id,
       name,
       email,
       status,
       updated_at`,
    [newStatus, userId],
  );

  const updatedUser = updatedResult.rows[0];

  if (newStatus === "suspended" || newStatus === "banned") {
    await databaseConnection.query(
      `UPDATE sessions
       SET is_revoked = true
       WHERE user_id = $1
       AND is_revoked = false`,
      [userId],
    );
  }

  const actionMap: Record<UserStatus, string> = {
    suspended: "user.suspended",
    banned: "user.banned",
    active: "user.activated",
  };

  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, target_id, action, module, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      caller.id,
      userId,
      actionMap[newStatus],
      "users",
      JSON.stringify({
        old_status: existing.status,
        new_status: newStatus,
      }),
    ],
  );

  return updatedUser;
};

export const getUserPermissions = async (
  userId: string,
  caller: { id: string; role: string },
) => {
  const userResult = await databaseConnection.query(
    `SELECT
      u.id,
      u.name,
      u.manager_id,
      r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (caller.role === "manager") {
    if (user.manager_id !== caller.id) {
      throw new ApiError(403, "Access denied — this user is not in your team");
    }
  }

  const roleDefaultsResult = await databaseConnection.query(
    `SELECT
      p.id,
      p.atom,
      p.module,
      p.description
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u             ON u.role_id = rp.role_id
     WHERE u.id = $1
     ORDER BY p.module, p.atom`,
    [userId],
  );

  const overridesResult = await databaseConnection.query(
    `SELECT
      up.id,
      up.granted,
      up.updated_at,
      p.id          AS permission_id,
      p.atom,
      p.module,
      p.description,
      cb.name       AS granted_by_name
     FROM user_permissions up
     JOIN permissions p ON p.id  = up.permission_id
     LEFT JOIN users cb ON cb.id = up.granted_by
     WHERE up.user_id = $1
     ORDER BY p.module, p.atom`,
    [userId],
  );

  const resolvedResult = await databaseConnection.query(
    `SELECT DISTINCT p.atom
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u             ON u.role_id = rp.role_id
     LEFT JOIN user_permissions up
       ON up.permission_id = p.id
       AND up.user_id = $1
     WHERE u.id = $1
     AND COALESCE(up.granted, true) = true`,
    [userId],
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    roleDefaults: roleDefaultsResult.rows,
    overrides: overridesResult.rows,
    resolved: resolvedResult.rows.map((r: { atom: string }) => r.atom),
    summary: {
      totalRoleDefaults: roleDefaultsResult.rows.length,
      totalOverrides: overridesResult.rows.length,
      totalResolved: resolvedResult.rows.length,
    },
  };
};

export const overrideUserPermission = async (
  userId: string,
  permissionId: string,
  granted: boolean,
  caller: { id: string; role: string },
) => {
  const userResult = await databaseConnection.query(
    `SELECT
      u.id,
      u.name,
      u.manager_id,
      r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (userId === caller.id) {
    throw new ApiError(400, "You cannot override your own permissions");
  }

  if (caller.role === "manager") {
    if (user.manager_id !== caller.id) {
      throw new ApiError(403, "Access denied — this user is not in your team");
    }
  }

  const permissionResult = await databaseConnection.query(
    `SELECT id, atom FROM permissions WHERE id = $1`,
    [permissionId],
  );

  const permission = permissionResult.rows[0];

  if (!permission) {
    throw new ApiError(404, "Permission not found");
  }

  if (granted) {
    const callerHasPermission = await databaseConnection.query(
      `SELECT DISTINCT p.atom
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN users u             ON u.role_id = rp.role_id
       LEFT JOIN user_permissions up
         ON up.permission_id = p.id
         AND up.user_id = $1
       WHERE u.id = $1
       AND p.id   = $2
       AND COALESCE(up.granted, true) = true`,
      [caller.id, permissionId],
    );

    if (callerHasPermission.rows.length === 0) {
      throw new ApiError(
        403,
        "Grant ceiling violation — you cannot grant a permission you don't have",
      );
    }
  }

  await databaseConnection.query(
    `INSERT INTO user_permissions
      (user_id, permission_id, granted, granted_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, permission_id)
     DO UPDATE SET
       granted    = $3,
       granted_by = $4,
       updated_at = NOW()`,
    [userId, permissionId, granted, caller.id],
  );

  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, target_id, action, module, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      caller.id,
      userId,
      granted ? "permission.granted" : "permission.revoked",
      "permissions",
      JSON.stringify({
        permissionAtom: permission.atom,
        targetUser: user.name,
        granted,
      }),
    ],
  );

  return {
    userId,
    permissionId,
    atom: permission.atom,
    granted,
  };
};
