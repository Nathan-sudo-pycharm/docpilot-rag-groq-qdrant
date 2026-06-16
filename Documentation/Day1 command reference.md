# DocPilot — Command Reference (Day 1)

Quick reference for every command used. Copy-paste ready.

---

## Git

```powershell
# Create and switch to a day branch
git checkout -b day/01-foundations

# Stage all changes
git add .

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

---

## Python / Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Deactivate
deactivate

# Install packages
pip install fastapi "uvicorn[standard]" python-dotenv pydantic-settings

# Save installed packages to file
pip freeze > requirements.txt

# Install from requirements file (on a new machine)
pip install -r requirements.txt
```

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
http://localhost:8000/docs       ← Swagger UI (interactive API docs)
http://localhost:8000/redoc      ← alternative API docs
```

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
# Run Qdrant (Day 2)
docker run -d `
  --name qdrant `
  -p 6333:6333 `
  -v ${PWD}/qdrant_storage:/qdrant/storage `
  qdrant/qdrant

# Stop Qdrant
docker stop qdrant

# Start existing Qdrant container
docker start qdrant

# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a
```

**Useful URLs when Qdrant is running:**
```
http://localhost:6333/dashboard     ← Qdrant web UI
```

---

## File System (PowerShell)

```powershell
# Create folders
mkdir backend\app\routes

# Create empty file
New-Item app\__init__.py -ItemType File

# List files
ls

# Show file contents
cat filename.txt

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

## Two PowerShell Tabs Needed During Development

```
Tab 1 → backend folder, venv active → runs uvicorn
Tab 2 → project root → git commands, npm commands
```

Keep both open while working.