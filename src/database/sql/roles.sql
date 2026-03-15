CREATE TABLE
    roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );