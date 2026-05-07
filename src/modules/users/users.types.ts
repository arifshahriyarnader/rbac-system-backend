export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  manager: string | null;
  created_by: string | null;
  last_login: Date | null;
  created_at: Date;
}

export interface UserDetailRow extends UserRow {
  permissions: string[];
}

export interface CreatedUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: Date;
}

export interface UpdatedUserRow {
  id:         string;
  name:       string;
  email:      string;
  password:   string;
  role:       string;
  managerId: string;
  status:     string;
  updated_at: Date;
}