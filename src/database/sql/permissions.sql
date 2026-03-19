CREATE TABLE
    permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        atom VARCHAR(100) UNIQUE NOT NULL,
        module VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );