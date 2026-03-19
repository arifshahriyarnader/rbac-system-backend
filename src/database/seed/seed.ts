import {
  seedAdmin,
  seedPermissions,
  seedRolePermissions,
  seedRoles,
} from "./index";

async function runSeeds() {
  try {
    console.log("Seeding Started...");
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedAdmin();
    console.log("Seeding Completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();
