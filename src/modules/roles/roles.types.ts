export interface RoleRow {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}

export interface RolePermissionRow {
  id: string;
  atom: string;
  module: string;
  description: string;
}
