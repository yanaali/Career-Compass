from unittest.mock import Mock
from fastapi.testclient import TestClient
import pytest
from compass_ai import main


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_TOKEN", "internal-test-token")
    return TestClient(main.app)


def test_internal_endpoint_requires_service_authentication(client, monkeypatch):
    engine = Mock()
    monkeypatch.setattr(main, "engine", engine)
    assert client.post("/chat", json={"owner_id": "victim", "question": "Secrets?"}).status_code == 401
    engine.assert_not_called()


def test_blank_token_fails_closed(client, monkeypatch):
    monkeypatch.setenv("AI_SERVICE_TOKEN", "")
    assert client.post("/chat", json={"owner_id": "a", "question": "Hi"}).status_code == 503


def test_valid_internal_request_passes_owner_to_retrieval(client, monkeypatch):
    rag = Mock()
    rag.chat.return_value = {"message": "Java [S1]", "sources": []}
    monkeypatch.setattr(main, "engine", lambda: rag)
    response = client.post("/chat", headers={"Authorization": "Bearer internal-test-token"},
                           json={"owner_id": "issuer|alice", "question": "Skills?"})
    assert response.status_code == 200
    rag.chat.assert_called_once_with("issuer|alice", "Skills?")


def test_provider_failure_does_not_disclose_secrets(client, monkeypatch):
    rag = Mock()
    rag.chat.side_effect = RuntimeError("secret-api-key-and-resume-content")
    monkeypatch.setattr(main, "engine", lambda: rag)
    response = client.post("/chat", headers={"Authorization": "Bearer internal-test-token"},
                           json={"owner_id": "alice", "question": "Skills?"})
    assert response.status_code == 503
    assert "secret-api-key" not in response.text


def test_unknown_fields_cannot_supply_instructions_or_sql(client):
    response = client.post("/chat", headers={"Authorization": "Bearer internal-test-token"},
                           json={"owner_id": "alice", "question": "Skills?", "sql": "SELECT * FROM documents"})
    assert response.status_code == 422
