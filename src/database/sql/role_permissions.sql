CREATE TABLE
    role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        role_id UUID REFERENCES roles (id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions (id) ON DELETE CASCADE,
        UNIQUE (role_id, permission_id)
    );