# DocPilot — Day 1 Engineering Notes

**Date:** Day 1  
**Branch:** `day/01-foundations`  
**Status:** ✅ Complete, merged to main

---

## What Was Built Today

### 1. Project Repository
- Repo name: `docpilot-rag-groq-qdrant`
- Location: `D:\codes\python\docpilot-rag-groq-qdrant`
- Initialised with MIT License, .gitignore, planning README
- Branch strategy introduced: `day/XX-name` per day, merged to `main` at end of day

### 2. FastAPI Backend Scaffold
- Location: `backend/`
- Virtual environment created at `backend/venv/`
- FastAPI app created at `backend/app/main.py`
- Running on `http://localhost:8000`

**Endpoints created:**
| Method | Path | What it does |
|---|---|---|
| GET | `/health` | Returns `{"status": "ok", "service": "docpilot-api"}` |
| GET | `/docs` | Auto-generated Swagger UI (free from FastAPI) |

**Middleware added:**
- CORS — allows `http://localhost:3000` to call the backend

### 3. Next.js Frontend Scaffold
- Location: `frontend/`
- Created with `create-next-app` using TypeScript, Tailwind, App Router, src directory
- Running on `http://localhost:3000`
- Shows default Next.js starter page (will be replaced Day 5)

---

## Folder Structure After Day 1

```
docpilot-rag-groq-qdrant/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          ← FastAPI app, CORS, health check
│   │   ├── routes/
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   └── __init__.py
│   │   └── core/
│   │       └── __init__.py
│   ├── venv/                ← never committed to git
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       └── page.tsx     ← default Next.js starter
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## Decisions Made Today

| Decision | What we chose | Why |
|---|---|---|
| UI layout | Single page, two panels | Better UX than separate upload/chat pages |
| LLM | Groq + Llama 3.1 | Free tier, fast inference, no card needed |
| Embeddings | nomic-embed-text via Groq | Free, 768 dimensions, good quality |
| Vector DB | Qdrant | Open-source, self-hostable, no paid tier |
| Frontend | Next.js 14 + TypeScript | Strong hiring signal for EU/AI startups |
| License | MIT | Standard for open-source portfolio projects |
| Repo name | docpilot-rag-groq-qdrant | Keyword-rich, readable, memorable |

---

## Concepts Learned Today

### Why `__init__.py`?
Empty files that tell Python "this folder is a package." Without them, Python can't import files from that folder. Every folder inside `backend/app/` needs one.

### Why CORS middleware?
Browser security rule: a page on `localhost:3000` cannot call `localhost:8000` unless the server explicitly permits it. The `CORSMiddleware` adds `Access-Control-Allow-Origin` headers to every response, which tells the browser "this is allowed."

### Why virtual environment?
Isolates Python packages for this project. Without it, packages install globally and different projects can conflict with each other. The `venv` folder is never committed to git.

### Why `--reload` in uvicorn?
Makes the server automatically restart whenever you save a Python file. Essential during development — without it you'd need to manually restart after every change.

### What is FastAPI `/docs`?
FastAPI reads your code and auto-generates an interactive Swagger UI at `/docs`. Every endpoint you create appears there automatically. You can test endpoints directly from the browser — no Postman needed.

---

## Commits Made Today

```
feat(backend): FastAPI scaffold with CORS and health check
feat(frontend): Next.js 14 TypeScript scaffold with Tailwind
```

---

## What Day 2 Will Build

- `backend/app/core/config.py` — reads env vars from `.env` using pydantic-settings
- `backend/app/core/qdrant.py` — Qdrant client singleton + collection bootstrap
- Update `main.py` with lifespan startup that creates the Qdrant collection
- Run Qdrant in Docker and confirm connection