import io
from unittest.mock import Mock
import pytest
from pypdf import PdfWriter
from compass_ai.rag import CareerRag, WorkspaceError, answer_from_chunks, extract_text, vector_literal


def test_constructs_real_langchain_pipeline_without_network_calls(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-not-a-real-key")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.setenv("AWS_EC2_METADATA_DISABLED", "true")
    rag = CareerRag()
    assert rag.embeddings.dimensions == 1536
    assert rag.splitter.split_text("Java and AWS") == ["Java and AWS"]


def test_empty_context_does_not_call_model():
    chain = Mock()
    result = answer_from_chunks("Which jobs fit?", [], chain)
    assert result["sources"] == []
    assert "don't have enough" in result["message"]
    chain.invoke.assert_not_called()


def test_only_cited_retrieved_sources_are_returned():
    chain = Mock()
    chain.invoke.return_value = "Emphasize your AWS project [S2]."
    chunks = [{"source_id": "application:1", "title": "Role", "content": "Java role"},
              {"source_id": "document:2", "title": "Project", "content": "Built on AWS"}]
    result = answer_from_chunks("What should I emphasize?", chunks, chain)
    assert [s["id"] for s in result["sources"]] == ["document:2"]
    assert result["sources"][0]["excerpt"] == "Built on AWS"


@pytest.mark.parametrize("answer", ["Trust me without evidence", "You worked at NASA [S99]."])
def test_missing_or_fabricated_citations_are_rejected(answer):
    chain = Mock()
    chain.invoke.return_value = answer
    result = answer_from_chunks("Experience?", [{"source_id": "x", "title": "Resume", "content": "Java"}], chain)
    assert result["sources"] == []
    assert "valid source references" in result["message"]


def test_text_extraction_and_limits():
    assert extract_text(b"  Java and AWS\n", "text/plain") == "Java and AWS"
    with pytest.raises(WorkspaceError):
        extract_text(b" " * (5 * 1024 * 1024 + 1), "text/plain")
    with pytest.raises(WorkspaceError):
        extract_text(b" ", "text/plain")


def test_scanned_or_empty_pdf_is_not_invented_as_text():
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    stream = io.BytesIO()
    writer.write(stream)
    with pytest.raises(WorkspaceError, match="OCR"):
        extract_text(stream.getvalue(), "application/pdf")


def test_embedding_rejects_invalid_dimension_and_nonfinite_numbers():
    with pytest.raises(ValueError):
        vector_literal([1.0])
    with pytest.raises(ValueError):
        vector_literal([float("nan")] * 1536)
    assert vector_literal([0.0] * 1536).startswith("[0.0,")
