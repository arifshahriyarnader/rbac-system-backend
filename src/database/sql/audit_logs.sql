CREATE TABLE
    audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        actor_id UUID REFERENCES users (id),
        user_id UUID REFERENCES users (id),
        action VARCHAR(100) NOT NULL,
        module VARCHAR(50),
        entity_type VARCHAR(50),
        entity_id UUID,
        metadata JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );