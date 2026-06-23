# DocPilot — Command Reference

Quick reference for every command used. Copy-paste ready.

---

## Git

```powershell
# Create and switch to a day branch
git checkout -b day/01-foundations

# Stage all changes
git add .

# Stage a specific file only
git add backend/app/core/config.py

# Commit with a message
git commit -m "feat(backend): FastAPI scaffold with CORS and health check"

# Push branch to GitHub
git push origin day/01-foundations

# Merge day branch back to main
git checkout main
git merge day/01-foundations
git push origin main

# Create a release tag
git tag -a v0.1.0 -m "Backend complete"
git push origin v0.1.0

# Undo an in-progress merge with conflicts (before resolving)
git merge --abort

# Undo a completed merge/commit (discards the last commit)
git reset --hard HEAD~1

# Check if a file is tracked by git
git ls-files | Select-String "filename"

# Remove a file/folder from git tracking WITHOUT deleting it from disk
git rm -r --cached folder_name

# Search .gitignore for a specific rule
cat .gitignore | Select-String "lib"
```

**Commit message format:**
```
feat(scope):     new feature
fix(scope):      bug fix
chore:           config, tooling, deps
docs:            README, comments
test:            adding tests
refactor(scope): restructure, no behaviour change
```

**Rule of thumb:** checkout the destination branch first, then merge the source branch into it.
Full explanation in `git-learning-log.md`.

**Gitignore gotcha:** a pattern like `lib/` (no leading slash) matches a folder named `lib`
ANYWHERE in the repo, not just at the root. Use `/lib/` to match only the root-level folder,
or be specific like `backend/venv/lib/`.

---

## Python / Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Deactivate
deactivate

# Install packages — use python -m pip if bare pip is blocked
# by an Application Control / antivirus policy (common on
# managed Windows machines)
python -m pip install fastapi "uvicorn[standard]" python-dotenv pydantic-settings

# Save installed packages to file
python -m pip freeze > requirements.txt

# Install from requirements file (on a new machine)
python -m pip install -r requirements.txt

# Check an installed package's version (useful when API methods
# don't match older example code/tutorials)
python -m pip show qdrant-client

# Open a Python shell to test imports/functions manually
python
# then inside the shell, e.g.:
from app.core.config import settings
print(settings.groq_api_key)
exit()
```

**If `pip.exe` is blocked with "Application Control policy" error:**
Always use `python -m pip ...` instead of `pip ...`.

---

## FastAPI / Uvicorn

```powershell
# Run the backend (from inside backend/ folder, with venv active)
uvicorn app.main:app --reload --port 8000

# If uvicorn.exe itself gets blocked by Application Control / Smart App Control:
python -m uvicorn app.main:app --reload --port 8000

# What each part means:
# app.main   → folder app, file main.py
# :app       → the variable named `app` inside main.py
# --reload   → restart on file save
# --port     → run on this port
```

**Useful URLs when backend is running:**
```
http://localhost:8000/health     ← health check
http://localhost:8000/docs       ← Swagger UI (interactive API docs, test endpoints here)
http://localhost:8000/redoc      ← alternative API docs
```

**Testing file upload endpoints:**
Use the `/docs` Swagger UI — click the endpoint, "Try it out", choose a file, "Execute".

**Testing streaming (SSE) endpoints:**
Swagger UI shows the full stream as a scrollable list of `data: token` lines once complete.

**Testing rate limiting manually:**
Click "Execute" repeatedly (11+ times within a minute) on a rate-limited endpoint. Expect a `429`.

---

## Next.js / npm

```powershell
# Create Next.js app (run once)
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Run frontend dev server (from inside frontend/ folder)
npm run dev

# Build for production
npm run build

# Install dependencies (after cloning on new machine)
npm install
```

**Useful URLs when frontend is running:**
```
http://localhost:3000     ← main app
```

---

## Docker (Qdrant)

```powershell
# Run Qdrant for the FIRST time — run this from the project ROOT
docker run -d --name qdrant -p 6333:6333 -v ${PWD}/qdrant_storage:/qdrant/storage qdrant/qdrant

# Start it again on subsequent days (container already exists)
docker start qdrant

# Stop Qdrant
docker stop qdrant

# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a

# Check Docker is installed and working
docker --version
```

**Useful URLs when Qdrant is running:**
```
http://localhost:6333/dashboard                    ← Qdrant web UI
http://localhost:6333/dashboard#/collections        ← view collections directly
```

**Deleting a collection (needed if vector_size changes):**
```python
from app.core.qdrant import get_qdrant
from app.core.config import settings
get_qdrant().delete_collection(settings.qdrant_collection)
```

**Checking a collection's point count directly via Python:**
```python
from app.core.qdrant import get_qdrant
from app.core.config import settings
info = get_qdrant().get_collection(settings.qdrant_collection)
print(info.points_count)
```

**Searching/querying a collection directly via Python (modern API):**
```python
from app.core.qdrant import get_qdrant
from app.core.config import settings
from app.services.embedder import embed_texts

[vector] = embed_texts(["some query text"])
response = get_qdrant().query_points(
    collection_name=settings.qdrant_collection,
    query=vector,
    limit=5,
    with_payload=True,
)
for point in response.points:
    print(point.payload["text"])
```

---

## File System (PowerShell)

```powershell
# Create folders
mkdir backend\app\routes

# Create empty file
New-Item app\__init__.py -ItemType File

# Move a file
Move-Item .env backend\.env

# Rename a file (useful for fixing typos!)
Rename-Item app/routes/injest.py ingest.py

# List files
ls

# Show file contents
cat filename.txt

# Search file contents for a specific string
cat .gitignore | Select-String ".env"

# Append a line to a file
Add-Content .gitignore "`nqdrant_storage/"

# Current directory
pwd

# Open VS Code in current folder
code .

# Open specific file in VS Code
code app/main.py
```

---

## Ports Used in This Project

| Service | Port | URL |
|---|---|---|
| Next.js frontend | 3000 | http://localhost:3000 |
| FastAPI backend | 8000 | http://localhost:8000 |
| Qdrant vector DB | 6333 | http://localhost:6333 |

---

## Environment Variables Reference

`backend/.env` (gitignored):
```
GROQ_API_KEY=gsk_...
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=support_docs
```
**Must live inside `backend/`**, not project root.

`frontend/.env.local` (gitignored):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
**Must have `NEXT_PUBLIC_` prefix** to be accessible in browser-side code.

---

## Windows-Specific Gotchas

| Problem | Fix |
|---|---|
| `pip.exe` blocked by Application Control policy | Use `python -m pip` instead of `pip` |
| `uvicorn.exe` blocked by Application Control / Smart App Control | Use `python -m uvicorn ...` instead |
| `ImportError: DLL load failed while importing cygrpc` | Smart App Control blocking grpc's compiled DLL — disable via Settings → Privacy & security → Windows Security → App & browser control → Smart App Control |
| `torch` DLL load fails (`WinError 1114`) | Install Microsoft Visual C++ Redistributable: https://aka.ms/vs/17/release/vc_redist.x64.exe — restart terminal |
| HuggingFace symlink warning on model download | Harmless — ignore |
| File saved in VS Code but Python still sees old version | Confirm the tab's unsaved-changes dot is gone |
| `TabError: inconsistent use of tabs and spaces` in interactive shell | Happens pasting indented code into `python` REPL — type manually or run as a script |
| `git add` says path is ignored, but it shouldn't be | Check root `.gitignore` for overly broad rules (e.g. `lib/` without a leading slash matching unrelated folders) |

---

## Library API Version Gotchas

| Library | Old API (tutorials/older docs) | New API (what we actually use) |
|---|---|---|
| `langchain` | `from langchain.text_splitter import ...` | `from langchain_text_splitters import ...` |
| `qdrant-client` | `client.search(...)` returns a bare list | `client.query_points(...)` returns an object with `.points` |

**General rule:** if example code throws an `AttributeError` or `ImportError`, check the installed version with `python -m pip show <package>` before assuming the code is wrong.

---

## TypeScript Quick Reference

```typescript
// Interface — defines the required shape of an object
interface Message {
  id: string
  role: "user" | "assistant"    // union type — only these exact values allowed
  content: string
  isStreaming?: boolean          // ? = optional field
}

// Function with typed parameter and return type
async function ingestDocument(file: File): Promise<IngestResponse> {
  // ...
}

// Non-null assertion — "trust me, this isn't undefined"
const API_URL = process.env.NEXT_PUBLIC_API_URL!
```

---

## Two PowerShell Tabs Needed During Development

```
Tab 1 → backend folder, venv active → runs uvicorn
Tab 2 → project root → git commands, npm commands, docker commands
```

Once frontend work begins, you may want a third tab for `npm run dev` inside `frontend/`.