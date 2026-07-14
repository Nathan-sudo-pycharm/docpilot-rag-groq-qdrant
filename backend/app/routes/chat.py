from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.rag import stream_answer, retrieve_context
import json

router = APIRouter(prefix="/chat", tags=["chat"])

limiter = Limiter(key_func=get_remote_address)

class ChatRequest(BaseModel):
    question: str

@router.post("")
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    chunks = retrieve_context(body.question)

    seen = set()
    sources = []
    for c in chunks:
        key = (c["source"], c["page"])
        if key not in seen:
            seen.add(key)
            sources.append({
                "filename": c["source"], 
                "page": c["page"] + 1 if c["page"] is not None else None
            })

    sources_json = json.dumps(sources)

    def event_stream():
        for token in stream_answer(body.question, chunks):
            safe_token = token.replace("\n", "\\n")
            yield f"data: {safe_token}\n\n"
        yield f"event: sources\ndata: {sources_json}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )