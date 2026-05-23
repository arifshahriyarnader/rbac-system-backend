import { databaseConnection } from "../../database";
import { RoleRow } from "./roles.types";

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
