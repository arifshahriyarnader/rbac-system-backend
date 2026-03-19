import { databaseConnection } from "../connection";

export const seedPermissions = async () => {
  console.log("Seeding permissions...");

  const result = await databaseConnection.query(`
    INSERT INTO permissions (atom, module, description) VALUES
      ('auth:login',           'auth',        'Can log into the system'),
      ('view:dashboard',       'dashboard',   'View main dashboard'),
      ('view:users',           'users',       'View user list'),
      ('manage:users',         'users',       'Create edit suspend ban users'),
      ('view:leads',           'leads',       'View leads list'),
      ('manage:leads',         'leads',       'Create and manage leads'),
      ('view:tasks',           'tasks',       'View tasks list'),
      ('manage:tasks',         'tasks',       'Create and manage tasks'),
      ('view:reports',         'reports',     'View reports'),
      ('view:audit-log',       'audit',       'View audit trail'),
      ('view:settings',        'settings',    'View settings page'),
      ('manage:settings',      'settings',    'Edit system settings'),
      ('manage:permissions',   'permissions', 'Grant or revoke permissions'),
      ('view:customer-portal', 'customer',    'Access customer portal')
    ON CONFLICT (atom) DO NOTHING
    RETURNING atom
  `);

  if (result.rows.length === 0) {
    console.log("Permissions already exist — skipped");
  } else {
    result.rows.forEach((row) => {
      console.log(`Permission created: ${row.atom}`);
    });
  }
};
