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
