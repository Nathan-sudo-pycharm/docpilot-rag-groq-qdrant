# DocPilot — Day 9: Docker Overview

## What We Did

The goal of Day 9 was to containerize the entire DocPilot stack so it can run anywhere with a single command, without manually setting up Python environments, Node.js, or Qdrant locally.

Before Docker, running the project required:
- Manually activating the Python venv
- Running `uvicorn` in one terminal
- Running `npm run dev` in another terminal
- Separately starting the Qdrant container with `docker start qdrant`

After Docker, everything starts with:
```bash
docker compose up
```

---

## What Got Dockerized

### 1. Backend (FastAPI)
- Base image: `python:3.11-slim`
- Installs all dependencies from `requirements.txt`
- Runs uvicorn on port `8000`
- Reads secrets from `backend/.env` via `env_file` in compose
- Connects to Qdrant using the `qdrant` service hostname inside Docker (not `localhost`)

### 2. Frontend (Next.js)
- Multi-stage build: `deps` → `builder` → `runner`
- Stage 1 (`deps`): installs npm packages
- Stage 2 (`builder`): runs `next build`, bakes in `NEXT_PUBLIC_API_URL` as a build arg
- Stage 3 (`runner`): lightweight production image that only runs the built app
- Served on port `3000`

### 3. Qdrant
- Uses the official `qdrant/qdrant:latest` image
- Persists vector data via a named Docker volume (`qdrant_storage`) so data survives container restarts
- Exposes ports `6333` (HTTP) and `6334` (gRPC)

---

## Important Concepts Applied

### NEXT_PUBLIC_* variables must be baked in at build time
Next.js `NEXT_PUBLIC_*` variables are embedded into the JavaScript bundle during `npm run build`, not at container runtime. Passing them via `environment:` in compose is too late. The fix was to pass `NEXT_PUBLIC_API_URL` as a Docker build argument (`ARG`) so it gets baked in during the builder stage.

### QDRANT_URL override in compose
The backend `.env` file has `QDRANT_URL=http://localhost:6333` for local development. Inside Docker, `localhost` doesn't refer to the Qdrant container — it refers to the backend container itself. The fix was to override it in compose via the `environment:` block with `QDRANT_URL=http://qdrant:6333`, using the Docker service name as the hostname. Compose's `environment:` takes priority over `env_file`, so local dev is unaffected.

### Named volume for Qdrant persistence
Without a volume, every `docker compose down` would wipe all stored vectors. The named volume `qdrant_storage` mounts to `/qdrant/storage` inside the container, so data persists across restarts and rebuilds.

### .dockerignore
Both services have a `.dockerignore` to prevent large/sensitive directories from being copied into the build context:
- Backend excludes: `venv/`, `__pycache__/`, `.env`, `.git`
- Frontend excludes: `node_modules/`, `.next/`, `.env.local`, `.git`

This keeps image sizes down and prevents secrets from ending up in image layers.

---

## End Result

All three services start together, connect to each other on Docker's internal network, and the full upload → embed → store → query → respond flow works identically to local development.