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

  const grouped = result.rows.reduce(
    (acc: Record<string, PermissionRow[]>, permission) => {
      const module = permission.module;

      if (!acc[module]) {
        acc[module] = [];
      }

      acc[module].push(permission);
      return acc;
    },
    {},
  );

  return {
    permissions: result.rows, 
    grouped, 
    total: result.rows.length,
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
    [permissionId]
  );

  const permission = result.rows[0];

  if (!permission) {
    throw new ApiError(404, "Permission not found");
  }

  return permission;
};