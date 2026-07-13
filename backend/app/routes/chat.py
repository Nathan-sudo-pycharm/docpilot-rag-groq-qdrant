from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.rag import stream_answer

router = APIRouter(prefix="/chat", tags=["chat"])

limiter = Limiter(key_func=get_remote_address)

class ChatRequest(BaseModel):
    question: str

@router.post("")
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    def event_stream():
        for token in stream_answer(body.question):
            if token.startswith("__SOURCES__"):
                # Send sources as a separate SSE event type so the
                # frontend can parse it differently from answer tokens.
                payload = token[len("__SOURCES__"):]
                yield f"event: sources\ndata: {payload}\n\n"
            else:
                yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
