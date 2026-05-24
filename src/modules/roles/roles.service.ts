import { databaseConnection } from "../../database";
import { ApiError } from "../../utlis/ApiError";
import { RolePermissionRow, RoleRow } from "./roles.types";

export const getAllRoles = async () => {
  const result = await databaseConnection.query<RoleRow>(
    `SELECT
      id,
      name,
      description,
      created_at
     FROM roles
     ORDER BY created_at ASC`,
  );

  return result.rows;
};

export const getRoleById = async (roleId: string) => {
  const result = await databaseConnection.query<RoleRow>(
    `SELECT
          id,
          name,
          description,
          created_at
         FROM roles
         WHERE id = $1`,
    [roleId],
  );
  const role = result.rows[0];
  if (!role) {
    throw new Error("Role not found");
  }
  return role;
};

export const getRolePermissions = async (roleId: string) => {
  const roleResult = await databaseConnection.query<RoleRow>(
    `SELECT id, name FROM roles WHERE id = $1`,
    [roleId],
  );

  const role = roleResult.rows[0];

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  const permissionsResult = await databaseConnection.query<RolePermissionRow>(
    `SELECT
      p.id,
      p.atom,
      p.module,
      p.description
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.module, p.atom`,
    [roleId],
  );

  return {
    role,
    permissions: permissionsResult.rows,
    total: permissionsResult.rows.length,
  };
};

export const assignPermissionToRole = async (
  roleId: string,
  permissionId: string,
  caller: {
    id: string;
    role: string;
  },
) => {
  const roleResult = await databaseConnection.query<RoleRow>(
    `SELECT id, name FROM roles WHERE id = $1`,
    [roleId],
  );

  const role = roleResult.rows[0];

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (role.name === "admin") {
    throw new ApiError(403, "Admin role permissions cannot be modified");
  }

  if (caller.role === "manager") {
    if (role.name === "manager") {
      throw new ApiError(
        403,
        "Managers cannot modify manager role permissions",
      );
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

  const callerHasPermission = await databaseConnection.query(
    `SELECT p.id
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u ON u.role_id = rp.role_id
     LEFT JOIN user_permissions up
       ON up.permission_id = p.id
       AND up.user_id = $1
     WHERE u.id = $1
     AND p.id = $2
     AND COALESCE(up.granted, true) = true`,
    [caller.id, permissionId],
  );

  if (callerHasPermission.rows.length === 0) {
    throw new ApiError(
      403,
      "Grant ceiling violation — you cannot grant a permission you don't have",
    );
  }

  const existingResult = await databaseConnection.query(
    `SELECT id FROM role_permissions
     WHERE role_id = $1
     AND permission_id = $2`,
    [roleId, permissionId],
  );

  if (existingResult.rows.length > 0) {
    throw new ApiError(409, "Permission already assigned to this role");
  }

  await databaseConnection.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     VALUES ($1, $2)`,
    [roleId, permissionId],
  );

  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, action, module, metadata)
     VALUES ($1, $2, $3, $4)`,
    [
      caller.id,
      "role.permission_assigned",
      "roles",
      JSON.stringify({
        roleId,
        roleName: role.name,
        permissionId,
        permissionAtom: permission.atom,
      }),
    ],
  );

  return {
    message: "Permission assigned successfully",
    role: role.name,
    permission: permission.atom,
  };
};

export const removePermissionFromRole = async (
  roleId: string,
  permissionId: string,
  caller: {
    id: string;
    role: string;
  },
) => {
  const roleResult = await databaseConnection.query<RoleRow>(
    `SELECT id, name FROM roles WHERE id = $1`,
    [roleId],
  );

  const role = roleResult.rows[0];

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (role.name === "admin") {
    throw new ApiError(403, "Admin role permissions cannot be modified");
  }

  if (caller.role === "manager" && role.name === "manager") {
    throw new ApiError(403, "Managers cannot modify manager role permissions");
  }

  const existingResult = await databaseConnection.query(
    `SELECT
      rp.id,
      p.atom
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1
     AND rp.permission_id = $2`,
    [roleId, permissionId],
  );

  const existing = existingResult.rows[0];

  if (!existing) {
    throw new ApiError(404, "Permission not assigned to this role");
  }

  await databaseConnection.query(
    `DELETE FROM role_permissions
     WHERE role_id = $1
     AND permission_id = $2`,
    [roleId, permissionId],
  );

  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, action, module, metadata)
     VALUES ($1, $2, $3, $4)`,
    [
      caller.id,
      "role.permission_removed",
      "roles",
      JSON.stringify({
        roleId,
        roleName: role.name,
        permissionId,
        permissionAtom: existing.atom,
      }),
    ],
  );

  return {
    message: "Permission removed successfully",
    role: role.name,
    permission: existing.atom,
  };
};
