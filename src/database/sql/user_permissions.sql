CREATE TABLE
    user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID REFERENCES users (id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions (id) ON DELETE CASCADE,
        granted BOOLEAN DEFAULT true,
        UNIQUE (user_id, permission_id)
    );