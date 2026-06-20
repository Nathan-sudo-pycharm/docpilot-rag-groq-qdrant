from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.qdrant import ensure_collection
from app.routes.ingest import router as ingest_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    ensure_collection()
    yield
    print("👋 Shutting down...")

app = FastAPI(title="DocPilot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "docpilot-api"}