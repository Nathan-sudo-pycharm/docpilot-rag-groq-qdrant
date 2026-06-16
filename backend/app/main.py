from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# FastAPI() creates your web application object.
# Think of it as the central hub — every route, middleware,
# and startup logic attaches to this one object.
app = FastAPI(title="DocPilot API")

# CORS middleware explained:
# Your browser has a security rule: a page loaded from localhost:3000
# cannot make requests to localhost:8000 unless the server explicitly
# says "that's okay." This middleware adds that permission to every
# response the backend sends.
# Without this, your Next.js frontend will be blocked the moment
# it tries to call the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# A health check endpoint.
# @app.get("/health") means: when a GET request arrives at /health,
# run this function and return the result as JSON.
# Useful for checking if the server is alive.
@app.get("/health")
async def health():
    return {"status": "ok", "service": "docpilot-api"}