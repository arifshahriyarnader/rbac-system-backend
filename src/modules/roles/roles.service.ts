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
     ORDER BY created_at ASC`
  );

  return result.rows;
};