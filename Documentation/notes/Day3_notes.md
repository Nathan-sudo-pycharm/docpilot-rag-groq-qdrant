# DocPilot — Day 3 Engineering Notes

**Date:** Day 3  
**Branch:** `day/03-injest-pipeline` *(typo in branch name, kept for consistency — see note below)*  
**Status:** ✅ Complete, merged to main, tagged `v0.1.0`

---

## What Was Built Today

This was the most important day of the backend build — the full RAG ingestion pipeline now works end to end.

### 1. PDF Chunker
- `backend/app/services/chunker.py`
- Uses `PyPDFLoader` (from `langchain_community`) to extract text from PDFs
- Uses `RecursiveCharacterTextSplitter` (from `langchain_text_splitters`) to split text into 500-character chunks with 50-character overlap
- Returns chunks with metadata (source filename, page number, page label)

### 2. Embedder — Major Pivot
- **Originally planned:** Groq for embeddings
- **Discovered:** Groq does not offer any embedding models — only LLM, audio (Whisper), and guard models
- **Switched to:** `sentence-transformers` running the `all-MiniLM-L6-v2` model **locally** on your machine
- Output: 384-dimensional vectors (not 768 as originally planned)
- `backend/app/services/embedder.py`

### 3. Ingest Route
- `backend/app/routes/ingest.py`
- `POST /ingest` — accepts a PDF upload, runs it through chunker → embedder → Qdrant upsert
- Registered on the main FastAPI app
- Required installing `python-multipart` (FastAPI dependency for handling file uploads)

### 4. Live End-to-End Test
- Uploaded a real PDF via Swagger UI (`/docs`)
- Got back `{"ingested_chunks": 8, "filename": "Ausschlussbescheid.pdf"}`
- Confirmed all 8 points visible in Qdrant dashboard with correct payload (text, source, page) and 384-dim vectors

### 5. Repo Hygiene Fix
- Discovered `qdrant_storage/` (Qdrant's binary database files) was being tracked by git
- Added to `.gitignore`, ran `git rm -r --cached qdrant_storage` to untrack without deleting local files
- Committed the cleanup

---

## Major Decision Change: Embeddings Provider

| | Original Plan | What We Actually Built |
|---|---|---|
| Provider | Groq | sentence-transformers (local) |
| Model | nomic-embed-text-v1.5 | all-MiniLM-L6-v2 |
| Vector size | 768 | 384 |
| Runs where | Cloud API | Your own machine (CPU) |
| API key needed | Yes (HuggingFace or Groq) | No |

**Why this happened:** Groq's API only serves LLM, audio, and safety models — never had an embeddings endpoint. This was caught by testing the actual API model list, not assumed from documentation.

**Why local embeddings turned out better:**
- Zero API keys for the embedding step — one less external dependency
- No network calls during ingestion — faster, no rate limits
- Genuinely a stronger technical signal for interviews — shows understanding of running models locally vs just calling APIs
- All-MiniLM-L6-v2 is a real, widely-used production embedding model — not a toy

**Side effect:** had to delete and recreate the Qdrant collection, since vector size is fixed at creation time and can't be changed on an existing collection.

---

## Folder Structure After Day 3

```
docpilot-rag-groq-qdrant/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── qdrant.py          ← vector_size now 384
│   │   ├── routes/
│   │   │   └── ingest.py          ← POST /ingest
│   │   └── services/
│   │       ├── chunker.py         ← PDF → chunks
│   │       └── embedder.py        ← local sentence-transformers
│   ├── .env
│   ├── venv/
│   └── requirements.txt
├── qdrant_storage/                 ← gitignored, untracked from git
├── frontend/
├── Documentation/
└── README.md
```

---

## Concepts Learned Today

### Why test the actual model list instead of trusting documentation
README plans and tutorials can be wrong or outdated. Calling `GET /models` against Groq's real API and printing the list immediately revealed the truth — no embeddings exist there. When something doesn't work as documented, querying the source of truth (the API itself) beats guessing or re-reading docs.

### Why vector_size can't be changed on an existing Qdrant collection
Qdrant allocates storage based on a fixed vector dimension at collection creation time. Every point in the collection must have a vector of exactly that size — there's no "resize" operation. Changing embedding models after the fact always means deleting and recreating the collection (and re-ingesting all documents).

### Why local embeddings don't need a GPU for this scale
`all-MiniLM-L6-v2` is a small model (~90MB). For a handful of PDF chunks at a time, CPU inference is fast enough that the user won't notice a difference from a cloud API call. GPU acceleration matters at much larger scale (millions of embeddings, real-time high-throughput systems) — not here.

### Why python-multipart is a separate dependency
FastAPI itself doesn't parse `multipart/form-data` (the format browsers use to send files). It delegates that parsing to `python-multipart`. FastAPI only raises the error when it actually hits a route using `UploadFile` — which is why this didn't surface until we wrote the `/ingest` route, not when we just installed FastAPI on Day 1.

### Why `git rm -r --cached` is different from `git rm -r`
`--cached` removes files from git's tracking (the staging area / repo history going forward) without touching the actual files on disk. Without `--cached`, git would delete the files from your computer too — which is the opposite of what we wanted, since Qdrant still needs those files to function locally.

---

## Bugs Encountered and Fixed

| Bug | Cause | Fix |
|---|---|---|
| `pip.exe` blocked by Application Control policy | Windows security policy | Use `python -m pip` instead of bare `pip` |
| `ImportError: cannot import name 'load_and_chunk'` | VS Code hadn't actually saved the file yet | Manually re-saved, confirmed tab dot disappeared |
| `groq.NotFoundError: model not found` | Groq has no embedding models at all | Switched to local sentence-transformers |
| `OSError: DLL initialization routine failed` (torch) | Missing Visual C++ Redistributable on Windows | Installed `vc_redist.x64.exe`, restarted terminal |
| `ModuleNotFoundError: No module named 'app.routes.ingest'` | File saved as `injest.py` (typo) instead of `ingest.py` | Renamed file with `Rename-Item` |
| `RuntimeError: Form data requires python-multipart` | FastAPI's file upload dependency not installed | `pip install python-multipart` |
| `qdrant_storage/` binary files tracked in git | Missing from `.gitignore` from the start | Added to `.gitignore`, ran `git rm -r --cached` |

---

## Commits Made Today

```
feat(backend): PDF loader and recursive text chunker service
feat(backend): switch to local sentence-transformers for embeddings (Groq has no embedding API)
fix(backend): correct vector_size to 384 to match all-MiniLM-L6-v2
chore(backend): add sentence-transformers to requirements
feat(backend): POST /ingest route - full PDF to Qdrant pipeline
feat(backend): register ingest router on main app
chore(backend): add python-multipart for file upload support
chore: ignore qdrant_storage, remove from git tracking
chore: untrack qdrant_storage files (already gitignored)
```

## Tag Created
```
v0.1.0 — "Ingestion pipeline complete: PDF to Qdrant with local embeddings"
```

---
