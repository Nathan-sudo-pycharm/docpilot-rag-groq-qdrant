# DocPilot — Docker Issues & Fixes (Day 9)

A log of every problem we hit during Dockerization and exactly how we resolved it.

---

## Issue 1: `pywin32==312` — No matching distribution found

### What happened
The backend build failed immediately during `pip install -r requirements.txt` with:
```
ERROR: Could not find a version that satisfies the requirement pywin32==312
ERROR: No matching distribution found for pywin32==312
```

### Why it happened
`pywin32` is a Windows-only package that wraps the Win32 API. It ended up in `requirements.txt` because it was a transitive dependency pulled into the local Windows venv by some dev tool. When pip tried to install it inside the Docker container (which runs Linux), no Linux version of `pywin32` exists, so pip failed.

### How we fixed it
Removed the `pywin32==312` line from `backend/requirements.txt`. The package is never used by the app code itself — nothing in FastAPI, LangChain, or Qdrant needs Win32 API access.

```powershell
(Get-Content requirements.txt) | Where-Object { $_ -notmatch "^pywin32" } | Set-Content requirements.txt
```

**Lesson:** When generating `requirements.txt` on Windows with `pip freeze`, Windows-only packages like `pywin32`, `pywinpty`, and `pypiwin32` can sneak in as transitive dependencies. Always check for them before Dockerizing. Better practice: use `pip-compile` or maintain a curated `requirements.in` file instead of raw `pip freeze`.

---

## Issue 2: Docker cache serving stale `requirements.txt`

### What happened
After removing `pywin32` from `requirements.txt` and rebuilding, the same error appeared again. The file was definitely updated locally but Docker kept failing on the same line.

### Why it happened
Docker caches each build layer. The `COPY requirements.txt .` layer had been cached from the previous (broken) build attempt. Even though the file changed on disk, Docker's layer invalidation didn't detect it in time and reused the stale cached layer.

### How we fixed it
Forced a full rebuild with `--no-cache`:
```powershell
docker compose build backend --no-cache
```

This bypassed all cached layers and ran every step fresh, picking up the updated `requirements.txt` correctly.

**Lesson:** When a file change doesn't seem to take effect in a Docker build, always try `--no-cache` before assuming the file is still wrong.

---

## Issue 3: `requirements.txt` written as UTF-16 by PowerShell

### What happened
After removing `pywin32` with the PowerShell `Set-Content` command, Git started reporting `requirements.txt` as a binary file:
```
Binary files a/backend/requirements.txt and b/backend/requirements.txt differ
```

### Why it happened
PowerShell's `Set-Content` cmdlet defaults to UTF-16 LE encoding on some versions of Windows. This added a BOM (byte order mark) and null bytes between every character, which Git correctly identified as binary content rather than text.

### How we fixed it
Re-encoded the file as UTF-8:
```powershell
Get-Content backend/requirements.txt | Set-Content -Encoding UTF8 backend/requirements.txt
```

**Lesson:** On Windows, always specify `-Encoding UTF8` explicitly when using `Set-Content` to write text files that will be used in cross-platform contexts (Docker, Git, Linux servers).

---

## Issue 4: `NEXT_PUBLIC_API_URL` would bake in as `undefined`

### What happened
The initial `docker-compose.yml` passed `NEXT_PUBLIC_API_URL` under the `environment:` block for the frontend service. This would have caused `API_URL` to be `undefined` in the compiled JavaScript bundle.

### Why it happened
Next.js `NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle at **build time** (during `npm run build`), not at container startup. The `environment:` block in compose only sets environment variables when the container starts, which is after the build has already happened inside the Dockerfile. By then it's too late — the bundle is already compiled with `undefined`.

### How we fixed it
Passed `NEXT_PUBLIC_API_URL` as a Docker build argument instead:

In `frontend/Dockerfile`:
```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
```

In `docker-compose.yml`:
```yaml
frontend:
  build:
    context: ./frontend
    args:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
```

The value is now available during `npm run build` and gets baked into the bundle correctly.

**Note:** The value is `http://localhost:8000` (not `http://backend:8000`) because `NEXT_PUBLIC_*` code runs in the **browser**, which is outside Docker's internal network. The browser can only reach the backend via the host machine's exposed port, not the Docker service name.

**Lesson:** In Next.js, `NEXT_PUBLIC_*` = build time. Everything else = runtime. When Dockerizing, build-time variables need to be passed as `ARG`/build args, not `environment:`.

---

## Issue 5: QDRANT_URL pointing to wrong host inside Docker

### What happened (potential — caught before it caused a runtime error)
The backend `.env` had `QDRANT_URL=http://localhost:6333`. Inside Docker, `localhost` inside the backend container refers to the backend container itself, not the Qdrant container. The backend would have failed to connect to Qdrant.

### How we fixed it
Added an `environment:` override in `docker-compose.yml` for the backend service:
```yaml
backend:
  environment:
    - QDRANT_URL=http://qdrant:6333
```

Docker Compose's `environment:` block takes priority over `env_file`, so inside Docker the backend uses `http://qdrant:6333` (the service name on Docker's internal network), while locally it still reads `http://localhost:6333` from `.env`. No change needed to the `.env` file or the Python code.

**Lesson:** Inside Docker Compose, services communicate with each other using their service name as the hostname, not `localhost`. Always override any hardcoded `localhost` URLs for inter-service communication when composing.