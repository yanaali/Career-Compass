CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE copilot_chunks (
    owner_id VARCHAR(512) NOT NULL,
    source_id VARCHAR(80) NOT NULL,
    chunk_index INTEGER NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    PRIMARY KEY (owner_id, source_id, chunk_index)
);
-- Exact search within each small private workspace avoids approximate-index filtering losses.
