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

# Open a Python shell to test imports/functions manually
python
# then inside the shell, e.g.:
from app.core.config import settings
print(settings.groq_api_key)
exit()
```

**If `pip.exe` is blocked with "Application Control policy" error:**
Always use `python -m pip ...` instead of `pip ...` — this routes through Python directly and bypasses the restriction on most managed/locked-down Windows systems.

---

## FastAPI / Uvicorn

```powershell
# Run the backend (from inside backend/ folder, with venv active)
uvicorn app.main:app --reload --port 8000

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
Use the `/docs` Swagger UI — click the endpoint, "Try it out", choose a file, "Execute". Easier than curl on Windows for multipart uploads.

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
Then restart uvicorn — `ensure_collection()` recreates it with the new config on startup.

**Checking a collection's point count directly via Python:**
```python
from app.core.qdrant import get_qdrant
from app.core.config import settings
info = get_qdrant().get_collection(settings.qdrant_collection)
print(info.points_count)
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

`backend/.env` (gitignored, never committed):

```
GROQ_API_KEY=gsk_...
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=support_docs
```

**Important:** `.env` must live inside `backend/`, not the project root — `pydantic-settings` resolves the path relative to where the process runs from.

---

## Windows-Specific Gotchas

| Problem | Fix |
|---|---|
| `pip.exe` blocked by Application Control policy | Use `python -m pip` instead of `pip` |
| `torch` DLL load fails (`WinError 1114`) | Install Microsoft Visual C++ Redistributable: https://aka.ms/vs/17/release/vc_redist.x64.exe — then restart terminal completely |
| HuggingFace symlink warning on model download | Harmless — ignore, or enable Windows Developer Mode to silence it |
| File saved in VS Code but Python still sees old version | Confirm the tab's unsaved-changes dot is gone; if unsure, save again with Ctrl+S |

---

## Two PowerShell Tabs Needed During Development

```
Tab 1 → backend folder, venv active → runs uvicorn
Tab 2 → project root → git commands, npm commands, docker commands
```

Keep both open while working.