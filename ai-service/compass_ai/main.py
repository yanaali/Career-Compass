import hmac
import os
from functools import lru_cache
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from .rag import CareerRag, WorkspaceError

app = FastAPI(title="Career Compass internal AI", docs_url=None, redoc_url=None, openapi_url=None)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    owner_id: str = Field(min_length=1, max_length=512)
    question: str = Field(min_length=1, max_length=4000)


def authenticate(authorization: str = Header(default="")):
    token = os.getenv("AI_SERVICE_TOKEN", "")
    if not token:
        raise HTTPException(503, "AI service is not configured")
    if not hmac.compare_digest(authorization.encode(), ("Bearer " + token).encode()):
        raise HTTPException(401, "Unauthorized")


@lru_cache
def engine():
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(503, "AI provider is not configured")
    return CareerRag()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat", dependencies=[Depends(authenticate)])
def chat(request: ChatRequest):
    try:
        return engine().chat(request.owner_id, request.question)
    except HTTPException:
        raise
    except WorkspaceError as error:
        raise HTTPException(422, str(error)) from None
    except Exception:
        raise HTTPException(503, "Could not complete the copilot request") from None
