ALTER TABLE applications ADD COLUMN owner_id VARCHAR(512) NOT NULL DEFAULT '${legacyOwner}';
ALTER TABLE applications ALTER COLUMN owner_id DROP DEFAULT;
ALTER TABLE applications DROP CONSTRAINT applications_pkey;
ALTER TABLE applications ADD PRIMARY KEY (owner_id, id);
CREATE INDEX applications_owner_created_idx ON applications (owner_id, created_at DESC);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    owner_id VARCHAR(512) NOT NULL,
    filename VARCHAR(200) NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('resume', 'job', 'project')),
    object_key VARCHAR(512) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX documents_owner_idx ON documents (owner_id, created_at DESC);
