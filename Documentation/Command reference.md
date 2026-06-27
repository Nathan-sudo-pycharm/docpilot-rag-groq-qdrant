# DocPilot — Command Reference

Quick reference for every command used. Copy-paste ready.

---

## Git

```powershell
# Create and switch to a day branch
git checkout -b day/01-foundations

# Stage / commit / push
git add .
git commit -m "feat(backend): FastAPI scaffold with CORS and health check"
git push origin day/01-foundations

# Merge day branch back to main
git checkout main
git merge day/01-foundations
git push origin main

# Create a release tag
git tag -a v0.1.0 -m "Backend complete"
git push origin v0.1.0

# Undo an in-progress merge with conflicts
git merge --abort

# Undo a completed merge/commit
git reset --hard HEAD~1

# Check if a file is tracked
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

---

## Python / Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Use python -m pip if bare pip is blocked
python -m pip install fastapi "uvicorn[standard]" python-dotenv pydantic-settings
python -m pip freeze > requirements.txt
python -m pip show qdrant-client

# Test imports/functions manually
python
from app.core.config import settings
print(settings.groq_api_key)
exit()
```

---

## FastAPI / Uvicorn

```powershell
uvicorn app.main:app --reload --port 8000
# If blocked: python -m uvicorn app.main:app --reload --port 8000
```

**Useful URLs:**
```
http://localhost:8000/health
http://localhost:8000/docs       ← test all endpoints here, including DELETE routes
```

**Testing DELETE endpoints via Swagger:**
Click the endpoint, "Try it out", fill in the path parameter (e.g. filename), Execute.

---

## Next.js / npm

```powershell
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm run dev
```

**URL:** `http://localhost:3000`

---

## Docker (Qdrant)

```powershell
docker run -d --name qdrant -p 6333:6333 -v ${PWD}/qdrant_storage:/qdrant/storage qdrant/qdrant
docker start qdrant
docker stop qdrant
docker ps
```

**Dashboard:** `http://localhost:6333/dashboard`

**Querying/deleting via Python:**
```python
from app.core.qdrant import get_qdrant
from app.core.config import settings
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Check point count
info = get_qdrant().get_collection(settings.qdrant_collection)
print(info.points_count)

# Delete by filter (e.g. by source filename)
get_qdrant().delete(
    collection_name=settings.qdrant_collection,
    points_selector=Filter(
        must=[FieldCondition(key="source", match=MatchValue(value="somefile.pdf"))]
    ),
)
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
| `torch` DLL load fails (`WinError 1114`) | Install Visual C++ Redistributable |
| `git add` says path is ignored unexpectedly | Check root `.gitignore` for overly broad rules like bare `lib/` |
| "Failed to fetch" in Swagger with no status code | Backend isn't actually running — check the uvicorn terminal, you may have closed/interrupted it to run something else |

---

## Library API Version Gotchas

| Library | Old API | New API (what we actually use) |
|---|---|---|
| `langchain` | `from langchain.text_splitter import ...` | `from langchain_text_splitters import ...` |
| `qdrant-client` | `client.search(...)` returns a bare list | `client.query_points(...)` returns object with `.points` |

---

## TypeScript Quick Reference

```typescript
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

async function ingestDocument(file: File): Promise<IngestResponse> { ... }

const API_URL = process.env.NEXT_PUBLIC_API_URL!   // non-null assertion

// Event types for specific DOM elements
const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { ... }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }

// Optional chaining with array access
const file = e.target.files?.[0]
```

---

## React Hooks Quick Reference

```typescript
const [messages, setMessages] = useState<Message[]>([])
const sendMessage = useCallback(async (q: string) => { ... }, [])
const bottomRef = useRef<HTMLDivElement>(null)
useEffect(() => { bottomRef.current?.scrollIntoView() }, [messages])

// Safe state updates using the previous-state function form
setDocuments(prev => prev.filter(doc => doc.filename !== filename))
setDocuments(prev => [newDoc, ...prev])

// Props pattern — child receives data + callbacks, doesn't own logic
interface Props {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}
function FileUploader({ onUpload, isUploading }: Props) { ... }
```

---

## Streaming (SSE) Quick Reference

```typescript
const res = await fetch(url, { method: "POST", body: JSON.stringify(data) })
const reader = res.body!.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  // parse "data: token\n\n" lines from `text` here
}
```

**Backend sends:** `data: token\n\n` per token, then `data: [DONE]\n\n` when finished.

---

## Tailwind Patterns Used

```jsx
{/* group / group-hover — reveal an element only when hovering its PARENT */}
<div className="group">
  <button className="opacity-0 group-hover:opacity-100">✕</button>
</div>

{/* Conditional className with template literals */}
className={`base-classes ${isActive ? "active-classes" : "inactive-classes"}`}
```

---

## Two/Three Terminal Tabs Needed During Development

```
Tab 1 → backend folder, venv active → runs uvicorn
Tab 2 → frontend folder → runs npm run dev
Tab 3 → project root → git commands, docker commands
```