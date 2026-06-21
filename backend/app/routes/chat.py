from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.rag import stream_answer

#Note: request: Request is required as a parameter for slowapi's rate limiter to inspect the caller's IP — even though we don't use it directly in the function body.

router = APIRouter(prefix="/chat", tags=["chat"])

# Limiter tracks requests per IP address (get_remote_address extracts
# the caller's IP from the request). We import the shared limiter
# instance from main.py rather than creating a new one here.
limiter = Limiter(key_func=get_remote_address)

class ChatRequest(BaseModel):
    question: str

@router.post("")
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    """
    Streams the RAG answer back as Server-Sent Events (SSE).

    SSE format: every message is a line starting with "data: "
    followed by two newlines. The browser parses this format
    to receive tokens as they arrive, instead of waiting for
    the full response.

    Rate limited to 10 requests per minute per IP — protects
    against abuse and keeps us within Groq's free tier limits.
    """
    def event_stream():
        for token in stream_answer(body.question):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"   # sentinel — tells frontend "stream is over"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable proxy buffering (Railway/Render use Nginx)
        },
    )