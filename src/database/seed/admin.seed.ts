import bcrypt from "bcrypt";
import { databaseConnection } from "../connection";

export const seedAdmin = async () => {
  console.log("Seeding admin user...");

  const existing = await databaseConnection.query(
    `SELECT id FROM users WHERE email = $1`,
    ["admin@digitalpylot.com"],
  );

  if (existing.rows.length > 0) {
    console.log("   ⏭️  Admin already exists — skipped");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await databaseConnection.query(
    `
    INSERT INTO users (
      name,
      email,
      password_hash,
      role_id,
      status
    ) VALUES ($1, $2, $3,
      (SELECT id FROM roles WHERE name = 'admin'),
      'active'
    )
  `,
    ["Super Admin", "admin@digitalpylot.com", passwordHash],
  );

  console.log("   ✅ Admin user created");
  console.log("   📧 Email:    admin@digitalpylot.com");
  console.log("   🔑 Password: Admin@123");
};
