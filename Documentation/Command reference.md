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

**Gitignore gotcha:** a pattern like `lib/` (no leading slash) matches a folder named `lib`
ANYWHERE in the repo. Use `/lib/` to match only the root-level folder, or be specific.

---

## Python / Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install packages — use python -m pip if bare pip is blocked
python -m pip install fastapi "uvicorn[standard]" python-dotenv pydantic-settings

# Save installed packages to file
python -m pip freeze > requirements.txt

# Check an installed package's version
python -m pip show qdrant-client

# Open a Python shell to test imports/functions manually
python
from app.core.config import settings
print(settings.groq_api_key)
exit()
```

---

## FastAPI / Uvicorn

```powershell
# Run the backend (from inside backend/ folder, with venv active)
uvicorn app.main:app --reload --port 8000

# If uvicorn.exe gets blocked by Application Control / Smart App Control:
python -m uvicorn app.main:app --reload --port 8000
```

**Useful URLs:**
```
http://localhost:8000/health     ← health check
http://localhost:8000/docs       ← Swagger UI
```

---

## Next.js / npm

```powershell
# Create Next.js app (run once)
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Run frontend dev server
npm run dev
```

**Useful URLs:**
```
http://localhost:3000     ← main app
```

---

## Docker (Qdrant)

```powershell
# First time only — run from project ROOT
docker run -d --name qdrant -p 6333:6333 -v ${PWD}/qdrant_storage:/qdrant/storage qdrant/qdrant

# Subsequent days
docker start qdrant
docker stop qdrant
docker ps
```

**Dashboard:** `http://localhost:6333/dashboard`

**Querying Qdrant directly via Python (modern API):**
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
mkdir backend\app\routes
New-Item app\__init__.py -ItemType File
Move-Item .env backend\.env
Rename-Item app/routes/injest.py ingest.py
ls
cat filename.txt
cat .gitignore | Select-String ".env"
Add-Content .gitignore "`nqdrant_storage/"
pwd
code .
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

`backend/.env`:
```
GROQ_API_KEY=gsk_...
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=support_docs
```

`frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Windows-Specific Gotchas

| Problem | Fix |
|---|---|
| `pip.exe` / `uvicorn.exe` blocked by Application Control policy | Use `python -m pip` / `python -m uvicorn` |
| `ImportError: DLL load failed while importing cygrpc` | Smart App Control blocking grpc's DLL — disable via Windows Security settings |
| `torch` DLL load fails (`WinError 1114`) | Install Visual C++ Redistributable: https://aka.ms/vs/17/release/vc_redist.x64.exe |
| `git add` says path is ignored unexpectedly | Check root `.gitignore` for overly broad rules like bare `lib/` |

---

## Library API Version Gotchas

| Library | Old API | New API (what we actually use) |
|---|---|---|
| `langchain` | `from langchain.text_splitter import ...` | `from langchain_text_splitters import ...` |
| `qdrant-client` | `client.search(...)` returns a bare list | `client.query_points(...)` returns object with `.points` |

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

## React Hooks Quick Reference

```typescript
// useState — a piece of state that triggers re-render when changed
const [messages, setMessages] = useState<Message[]>([])

// useCallback — keeps the same function reference across re-renders
// (the empty [] means "never recreate, doesn't depend on anything")
const sendMessage = useCallback(async (question: string) => { ... }, [])

// useRef — a persistent reference to a DOM element (or any value)
// that does NOT trigger a re-render when changed
const bottomRef = useRef<HTMLDivElement>(null)
// attach with: <div ref={bottomRef} />
// use with:    bottomRef.current?.scrollIntoView()

// useEffect — runs code after render, re-runs when dependencies change
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [messages])   // re-runs every time `messages` changes

// Props — data passed from parent to child component
interface Props {
  message: Message
}
function MessageBubble({ message }: Props) { ... }   // destructured from props
```

---

## Streaming (SSE) Quick Reference

```typescript
// Why not EventSource? It only supports GET — we need POST to send JSON body.
// So we build SSE parsing manually with fetch + ReadableStream:

const res = await fetch(url, { method: "POST", body: JSON.stringify(data) })
const reader = res.body!.getReader()      // gives us chunks as they arrive
const decoder = new TextDecoder()          // converts raw bytes to text

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  // parse "data: token\n\n" lines from `text` here
}
```

**Backend sends:** `data: token\n\n` per token, then `data: [DONE]\n\n` when finished.

---

## Two/Three Terminal Tabs Needed During Development

```
Tab 1 → backend folder, venv active → runs uvicorn
Tab 2 → frontend folder → runs npm run dev
Tab 3 → project root → git commands, docker commands
```