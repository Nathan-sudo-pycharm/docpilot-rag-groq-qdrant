from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.qdrant import ensure_collection
from app.routes.ingest import router as ingest_router
from app.routes.chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    ensure_collection()
    yield
    print("👋 Shutting down...")

app = FastAPI(title="DocPilot API", lifespan=lifespan)

# Rate limiter setup. We attach it to app.state so slowapi can
# track requests across the whole app, and register the exception
# handler so rate-limited requests get a clean 429 response instead
# of crashing.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(chat_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "docpilot-api"}