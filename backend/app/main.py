from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.qdrant import ensure_collection

# lifespan is a context manager that runs code when the server starts
# and when it stops. It replaces the older @app.on_event("startup") pattern.
#
# yield is the dividing line:
# - everything BEFORE yield = startup code
# - everything AFTER yield = shutdown code
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    ensure_collection()   # create Qdrant collection if it doesn't exist
    yield
    print("👋 Shutting down...")

app = FastAPI(title="DocPilot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "docpilot-api"}