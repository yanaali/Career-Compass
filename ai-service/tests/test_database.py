"""Runs against the CI pgvector service; no real AWS or model calls."""
import os
from pathlib import Path
from unittest.mock import Mock
import uuid
import psycopg
from psycopg.rows import dict_row
import pytest
from langchain_text_splitters import RecursiveCharacterTextSplitter
from compass_ai.rag import CareerRag

pytestmark = pytest.mark.skipif(not os.getenv("RUN_DATABASE_TESTS"), reason="Requires PostgreSQL + pgvector")


@pytest.fixture
def database(monkeypatch):
    # Only use a disposable test database; this fixture applies migrations and deletes test rows.
    assert os.getenv("PGDATABASE") == "compass_test"
    with psycopg.connect(row_factory=dict_row) as conn:
        migrations = Path(__file__).resolve().parents[2] / "backend/src/main/resources/db/migration"
        for path in sorted(migrations.glob("*.sql")):
            conn.execute(path.read_text().replace("${legacyOwner}", "local:compass"))
    yield
    with psycopg.connect() as conn:
        conn.execute("DROP TABLE copilot_chunks, documents, applications")


def fake_rag():
    rag = object.__new__(CareerRag)
    rag.embedding_model = "test"
    rag.embeddings = Mock()
    rag.embeddings.embed_documents.side_effect = lambda texts: [[1.0] + [0.0] * 1535 for _ in texts]
    rag.embeddings.embed_query.return_value = [1.0] + [0.0] * 1535
    rag.chain = Mock()
    rag.chain.invoke.return_value = "Your saved role uses Java [S1]."
    rag.splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)
    rag.s3 = Mock()
    return rag


def test_index_retrieval_updates_and_deletes_are_owner_scoped(database):
    alice_id, bob_id = uuid.uuid4(), uuid.uuid4()
    with psycopg.connect() as conn:
        for owner, record_id, company in [("alice", alice_id, "Alice Java"), ("bob", bob_id, "Bob SECRET")]:
            conn.execute("""INSERT INTO applications (owner_id,id,company,role,status,created_at)
                            VALUES (%s,%s,%s,'Engineer','Applied',CURRENT_TIMESTAMP)""", (owner, record_id, company))
    rag = fake_rag()
    bob_reply = rag.chat("bob", "Skills?")
    assert "Bob SECRET" in bob_reply["sources"][0]["title"]
    alice_reply = rag.chat("alice", "Skills?")
    assert len(alice_reply["sources"]) == 1
    assert "Bob" not in str(alice_reply)
    assert "Alice" in alice_reply["sources"][0]["title"]
    calls = rag.embeddings.embed_documents.call_count
    rag.chat("alice", "Skills again?")
    assert rag.embeddings.embed_documents.call_count == calls  # Cached content is not re-embedded.
    with psycopg.connect() as conn:
        conn.execute("UPDATE applications SET notes = 'AWS' WHERE owner_id = 'alice'")
    rag.chat("alice", "AWS?")
    assert rag.embeddings.embed_documents.call_count == calls + 1
    with psycopg.connect() as conn:
        conn.execute("DELETE FROM applications WHERE owner_id = 'alice'")
    assert rag.chat("alice", "Anything left?")["sources"] == []
    with psycopg.connect() as conn:
        assert conn.execute("SELECT count(*) FROM copilot_chunks WHERE owner_id = 'alice'").fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM copilot_chunks WHERE owner_id = 'bob'").fetchone()[0] > 0
