import { databaseConnection } from "../connection";

export const seedRolePermissions = async () => {
  console.log("Seeding role permissions...");

  await databaseConnection.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT
      (SELECT id FROM roles WHERE name = 'admin'),
      id
    FROM permissions
    ON CONFLICT DO NOTHING
  `);
  console.log("Admin → all permissions assigned");

  await databaseConnection.query(
    `
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT
      (SELECT id FROM roles WHERE name = 'manager'),
      id
    FROM permissions
    WHERE atom = ANY($1::text[])
    ON CONFLICT DO NOTHING
  `,
    [
      [
        "auth:login",
        "view:dashboard",
        "view:users",
        "manage:users",
        "view:leads",
        "manage:leads",
        "view:tasks",
        "manage:tasks",
        "view:reports",
        "manage:permissions",
        "view:settings",
      ],
    ],
  );
  console.log("Manager → permissions assigned");

  await databaseConnection.query(
    `
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT
      (SELECT id FROM roles WHERE name = 'agent'),
      id
    FROM permissions
    WHERE atom = ANY($1::text[])
    ON CONFLICT DO NOTHING
  `,
    [["auth:login", "view:dashboard", "view:leads", "view:tasks"]],
  );
  console.log("Agent → permissions assigned");

  await databaseConnection.query(
    `
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT
      (SELECT id FROM roles WHERE name = 'customer'),
      id
    FROM permissions
    WHERE atom = ANY($1::text[])
    ON CONFLICT DO NOTHING
  `,
    [["auth:login", "view:customer-portal"]],
  );
  console.log("Customer → permissions assigned");
};
