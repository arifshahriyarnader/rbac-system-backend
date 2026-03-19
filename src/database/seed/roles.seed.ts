import { databaseConnection } from "../connection";

export const seedRoles = async () => {
  console.log("Seeding roles...");

  const result = await databaseConnection.query(`
    INSERT INTO roles (name, description) VALUES
      ('admin',    'Full system control'),
      ('manager',  'Team and permission management'),
      ('agent',    'Operational staff with configurable access'),
      ('customer', 'End client with self-service portal access')
    ON CONFLICT (name) DO NOTHING
    RETURNING name
  `);

  if (result.rows.length === 0) {
    console.log("Roles already exist — skipped");
  } else {
    result.rows.forEach((row) => {
      console.log(`Role created: ${row.name}`);
    });
  }
};
