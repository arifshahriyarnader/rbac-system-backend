import { databaseConnection } from "../../database";
import { ApiError } from "../../utlis/ApiError";
import { PermissionRow } from "./permissions.types";

export const getAllPermissions = async () => {
  const result = await databaseConnection.query<PermissionRow>(
    `SELECT
      id,
      atom,
      module,
      description,
      created_at
     FROM permissions
     ORDER BY module, atom`,
  );

  const getRolePermissions = async (roleName: string) => {
    const roleResult = await databaseConnection.query<PermissionRow>(
      `SELECT
        p.id,
        p.atom,
        p.module,
        p.description
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN roles r             ON r.id = rp.role_id
       WHERE r.name = $1
       ORDER BY p.module, p.atom`,
      [roleName],
    );
    return roleResult.rows;
  };

  const [
    adminPermissions,
    managerPermissions,
    agentPermissions,
    customerPermissions,
  ] = await Promise.all([
    getRolePermissions("admin"),
    getRolePermissions("manager"),
    getRolePermissions("agent"),
    getRolePermissions("customer"),
  ]);

  const grouped = result.rows.reduce(
    (acc: Record<string, PermissionRow[]>, permission) => {
      const module = permission.module;
      if (!acc[module]) acc[module] = [];
      acc[module].push(permission);
      return acc;
    },
    {},
  );

  return {
    permissions: result.rows,
    grouped,
    total: result.rows.length,

    rolePermissions: {
      admin: {
        total: adminPermissions.length,
        permissions: adminPermissions,
      },
      manager: {
        total: managerPermissions.length,
        permissions: managerPermissions,
      },
      agent: {
        total: agentPermissions.length,
        permissions: agentPermissions,
      },
      customer: {
        total: customerPermissions.length,
        permissions: customerPermissions,
      },
    },
  };
};

export const getPermissionById = async (permissionId: string) => {
  const result = await databaseConnection.query<PermissionRow>(
    `SELECT
      id,
      atom,
      module,
      description,
      created_at
     FROM permissions
     WHERE id = $1`,
    [permissionId],
  );

  const permission = result.rows[0];

  if (!permission) {
    throw new ApiError(404, "Permission not found");
  }

  return permission;
};


