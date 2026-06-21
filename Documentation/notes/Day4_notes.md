# DocPilot — Day 4 Engineering Notes

**Date:** Day 4  
**Branch:** `day/04-rag-chat`  
**Status:** ✅ Complete, merged to main, tagged `v0.2.0`

---

## 🎉 Milestone: Backend Complete

This is the day the entire backend came together. Every piece built since Day 1 — config, Qdrant, chunking, embedding, ingestion — gets used here. Upload a PDF, ask a question, get a grounded, streaming, rate-limited answer. That's a real, working RAG system.

---

## What Was Built Today

### 1. RAG Service
- `backend/app/services/rag.py`
- `retrieve_context()` — embeds the question with the same local embedder from Day 3, searches Qdrant, returns top 5 matching chunks
- `stream_answer()` — builds a grounded prompt (context + question), streams the response token-by-token from Groq's `llama-3.1-8b-instant`

### 2. Streaming Chat Route
- `backend/app/routes/chat.py`
- `POST /chat` — accepts a question, returns a Server-Sent Events (SSE) stream
- Rate limited to 10 requests/minute per IP via `slowapi`

### 3. Rate Limiter Wiring
- `backend/app/main.py` updated with `Limiter` attached to `app.state`
- Custom exception handler registered so exceeding the limit returns a clean `429` JSON response instead of a server error

### 4. Live End-to-End Tests
- Tested retrieval alone — got 5 relevant chunks back from the already-ingested PDF
- Tested full `stream_answer()` in a Python shell — got an accurate, grounded answer about the PDF's content
- Tested `/chat` via Swagger — confirmed real SSE streaming output (`data: This`, `data: document`, etc.)
- Tested rate limiting — hit Execute 10+ times, got `429 {"error": "Rate limit exceeded: 10 per 1 minute"}` exactly as designed

---

## Bug Encountered and Fixed

| Bug | Cause | Fix |
|---|---|---|
| `AttributeError: 'QdrantClient' object has no attribute 'search'` | Installed `qdrant-client` 1.18.0 deprecated `.search()` in favor of `.query_points()` | Rewrote `retrieve_context()` to use `query_points()`, which returns a response object with a `.points` list instead of a bare list of hits |

**Lesson reinforced:** library APIs change between versions. The README's example code assumed an older `qdrant-client` API. Always test against the actual installed version rather than trusting example code verbatim — this is the second time this pattern has shown up (first was the LangChain import paths on Day 3).

---

## Folder Structure After Day 4

```
docpilot-rag-groq-qdrant/
├── backend/
│   ├── app/
│   │   ├── main.py                ← + rate limiter setup, chat router registered
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── qdrant.py
│   │   ├── routes/
│   │   │   ├── ingest.py
│   │   │   └── chat.py            ← POST /chat, SSE streaming, rate limited
│   │   └── services/
│   │       ├── chunker.py
│   │       ├── embedder.py
│   │       └── rag.py             ← retrieve_context() + stream_answer()
│   ├── .env
│   ├── venv/
│   └── requirements.txt
├── qdrant_storage/
├── frontend/                       ← still just the default Next.js scaffold
└── Documentation/
```

**The backend folder is now functionally complete.** Everything from Day 5 onward builds the frontend on top of this.

---

## Concepts Learned Today

### Why the system prompt explicitly says "answer ONLY from context"
Without this instruction, the LLM defaults to blending its training data with the provided context — which reintroduces the exact hallucination problem RAG is meant to solve. The instruction forces the model to treat the retrieved chunks as the sole source of truth, and to admit when it doesn't know rather than guess.

### Why `Generator[str, None, None]` matters for streaming
A regular function returns one value and exits. A generator (using `yield` instead of `return`) produces values one at a time, pausing in between. This is what lets `stream_answer()` hand tokens to the route as Groq produces them, instead of waiting for the entire response to finish before sending anything back to the browser.

### Why rate limiting needs `request: Request` even though it's unused
`slowapi`'s `@limiter.limit(...)` decorator inspects the incoming `Request` object to extract the caller's IP address (via `get_remote_address`). FastAPI's dependency injection passes this object into the function automatically — the parameter has to exist in the function signature for the decorator to access it, even if the function body never touches it directly.

### Why `X-Accel-Buffering: no` is still in the response headers
Even though we're running locally right now, this header matters the moment we deploy to Railway/Render — those platforms route traffic through Nginx, which buffers responses by default. Without this header, all the streamed tokens would arrive in one batch instead of trickling in — defeating the entire purpose of streaming. Setting it now means zero changes needed at deploy time.

### Why library API changes keep showing up
This project uses several fast-moving Python libraries (LangChain, qdrant-client) that have had major version releases recently. Tutorials and documentation often lag behind the latest API. The fix each time has been the same: test the actual installed behavior in a Python shell before building a whole route on top of an assumption.

---

## Commits Made Today

```
feat(backend): RAG service - retrieve from Qdrant then stream Groq Llama 3
feat(backend): POST /chat SSE streaming endpoint with rate limiting
feat(backend): wire slowapi rate limiter and register chat router
chore(backend): add slowapi for rate limiting
```

## Tag Created
```
v0.2.0 — "Backend complete: ingest + RAG + streaming chat with rate limiting"
```

---
