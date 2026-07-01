# DocPilot — Docker Commands Reference

A reference for every Docker command used during Day 9, what it does, and how we used it.

---

## Build Commands

### `docker compose build`
Builds all service images defined in `docker-compose.yml` without starting containers.

```powershell
docker compose build
```

Used to build both backend and frontend images in one shot. Good for catching Dockerfile errors before running anything.

---

### `docker compose build <service>`
Builds only a specific service image. Faster when iterating on one service.

```powershell
docker compose build backend
docker compose build frontend
```

Used when the backend build failed due to `pywin32` — we isolated and fixed it without rebuilding the frontend every time.

---

### `docker compose build --no-cache`
Forces a complete rebuild from scratch, ignoring all cached layers.

```powershell
docker compose build backend --no-cache
```

Used when Docker kept reusing a cached layer that still had `pywin32` in it, even after we removed it from `requirements.txt`. The cache was stale, so `--no-cache` bypassed it entirely.

---

### `docker compose build --progress=plain`
Shows the full, untruncated build output instead of the condensed summary.

```powershell
docker compose build backend --progress=plain
```

Used to diagnose the pip install failure — the default output cuts off the actual error message, while `--progress=plain` shows every line including the exact `ERROR:` that caused the failure.

---

## Run Commands

### `docker compose up`
Starts all services defined in `docker-compose.yml`. Streams logs from all containers into one terminal.

```powershell
docker compose up
```

Used to bring up backend, frontend, and Qdrant together and verify the full stack works end to end inside Docker.

---

### `docker compose up -d`
Same as above but runs in detached mode (background). Terminal stays free.

```powershell
docker compose up -d
```

Not used during Day 9 but useful to know — you'd use this in production or when you don't want the logs streaming to your terminal.

---

### `docker compose down`
Stops and removes all running containers. Does not delete volumes.

```powershell
docker compose down
```

---

### `docker compose logs <service>`
Shows logs from a specific container.

```powershell
docker compose logs qdrant
docker compose logs backend
```

Useful for checking if Qdrant started cleanly or if the backend hit a startup error.

---

## Diagnostic Commands

### `docker compose build <service> 2>&1 | Out-File build-error.log`
Redirects all build output (including stderr) to a log file for easier reading.

```powershell
docker compose build backend 2>&1 | Out-File build-error.log
```

Used when the terminal was truncating the error output and we needed the full build log saved to a file.

---

## Files That Drive These Commands

### `docker-compose.yml`
The central config file. Defines all three services (backend, frontend, qdrant), their ports, volumes, environment variables, build contexts, and dependencies.

### `backend/Dockerfile`
Tells Docker how to build the backend image: base image, system deps, pip install, copy app code, start uvicorn.

### `frontend/Dockerfile`
Multi-stage build: install npm packages, build Next.js app with env vars baked in, then produce a lean runner image.

### `backend/.dockerignore` / `frontend/.dockerignore`
Lists files and folders to exclude from the Docker build context. Keeps builds fast and images clean.