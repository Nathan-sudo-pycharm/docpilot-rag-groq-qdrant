# DocPilot — Day 2 Engineering Notes

**Date:** Day 2  
**Branch:** `day/02-qdrant-setup`  
**Status:** ✅ Complete, merged to main

---

## What Was Built Today

### 1. Qdrant Running Locally (Docker)
- Pulled and ran `qdrant/qdrant` image
- Mapped port 6333, mounted persistent storage volume
- Confirmed dashboard accessible at `http://localhost:6333/dashboard`

### 2. Config Management
- `backend/app/core/config.py` — reads `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_COLLECTION` from `.env` using `pydantic-settings`
- `.env` lives inside `backend/` (not project root) — relative path resolution requires this
- Confirmed working by importing `settings` in a Python shell and printing values

### 3. Qdrant Client Singleton
- `backend/app/core/qdrant.py`
- `get_qdrant()` — returns a single shared `QdrantClient` instance, created once and reused
- `ensure_collection()` — creates the `support_docs` collection if it doesn't exist, with vector size 768 and Cosine distance

### 4. Lifespan Startup Wiring
- Updated `backend/app/main.py` to use FastAPI's `lifespan` context manager
- `ensure_collection()` now runs automatically every time the server starts
- Confirmed in Qdrant dashboard: `support_docs` collection exists, status GREEN, 0 points, vector size 768, Cosine distance

---

## Folder Structure After Day 2

```
docpilot-rag-groq-qdrant/
├── backend/
│   ├── app/
│   │   ├── main.py               ← FastAPI app + lifespan startup
│   │   ├── core/
│   │   │   ├── config.py         ← pydantic-settings, reads .env
│   │   │   └── qdrant.py         ← client singleton + ensure_collection()
│   │   ├── routes/__init__.py
│   │   └── services/__init__.py
│   ├── .env                      ← GROQ_API_KEY, QDRANT_URL, QDRANT_COLLECTION (gitignored)
│   ├── venv/
│   └── requirements.txt
├── qdrant_storage/                ← Docker volume, gitignored
├── frontend/
└── README.md
```

---

## Decisions Made Today

| Decision | What we chose | Why |
|---|---|---|
| `.env` location | Inside `backend/`, not project root | `pydantic-settings` resolves `env_file` relative to where the process runs from |
| Qdrant persistence | Docker volume mount (`qdrant_storage/`) | Data survives container restarts |
| Vector size | 768 | Matches `nomic-embed-text-v1.5` embedding output dimensions |
| Distance metric | Cosine | Standard for text embeddings — measures direction/meaning, not magnitude |
| Client pattern | Singleton (`get_qdrant()`) | Avoids creating a new connection pool on every request |

---

## Concepts Learned Today

### Why does `.env` need to be inside `backend/`?
`pydantic-settings`'s `env_file = ".env"` is a relative path. It resolves relative to the current working directory of whatever process is running — which is `backend/` when we run `uvicorn app.main:app` from inside that folder. Put it anywhere else and the settings won't load, causing a `ValidationError: Field required`.

### Why a singleton for the Qdrant client?
`QdrantClient` holds an HTTP connection pool internally. Creating a new client per request wastes memory and time reopening connections. One client, created once at first use and reused for the app's lifetime, is the correct and efficient pattern. This is the same reasoning used for database connections in any backend framework.

### Why vector_size must match the embedding model
Every embedding model outputs vectors of a fixed length. `nomic-embed-text-v1.5` always outputs 768 numbers per text. If the Qdrant collection is configured for a different size (say, 1536 for OpenAI's `text-embedding-3-small`), every insert or search will fail with a dimension mismatch. The collection's vector config and the embedding model are a matched pair — change one, you must change the other.

### Why Cosine distance for text
Cosine similarity measures the angle between two vectors, ignoring their length (magnitude). For text embeddings, length differences between texts shouldn't make them seem "less similar" — only the meaning/direction should matter. A short sentence and a long paragraph about the same topic should still be considered similar; Cosine captures that, whereas Euclidean distance would unfairly penalise the length difference.

### What `lifespan` does in FastAPI
`lifespan` is a context manager that wraps the entire life of the application. Code before `yield` runs once at startup; code after `yield` runs once at shutdown. We use it to call `ensure_collection()` exactly once when the server boots, so every route can safely assume the Qdrant collection already exists — no route needs to check or create it itself.

---

## Git Concepts Reinforced Today
(Full detail in `GIT_LEARNING_LOG.md`)

- `checkout` vs `merge` — checkout switches where you stand, merge brings commits to wherever you're standing
- Always checkout the destination branch before merging the source branch into it
- Nothing is permanent until `git push` — merges and commits can be undone locally with `git merge --abort` or `git reset --hard HEAD~1`
- Split commits by logical unit, not by day — four separate commits today instead of one big dump

---

## Commits Made Today

```
feat(backend): pydantic-settings config reads from .env
feat(backend): Qdrant client singleton and collection bootstrap
feat(backend): lifespan startup bootstraps Qdrant collection
chore(backend): add qdrant-client to requirements
```

---

## What Day 3 Will Build

- `backend/app/services/chunker.py` — PDF loader + recursive text splitter
- `backend/app/services/embedder.py` — Groq embedding service (batch support)
- `backend/app/routes/ingest.py` — `POST /ingest` endpoint, full PDF → chunks → vectors → Qdrant pipeline
- Test the full pipeline with a real PDF via `curl`
- Tag milestone `v0.1.0` once ingestion is confirmed working