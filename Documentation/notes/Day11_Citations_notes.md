# DocPilot — Day 11: Source Citations Feature Notes

## What We Built

Added source citations to every assistant response. After the LLM streams its answer, each message now shows which document and page the answer came from:

```
Source: faq.pdf · page 3
Source: manual.pdf · page 7
```

This makes the system transparent — users can verify answers against the original document instead of blindly trusting the output.

---

## Architecture: How Citations Work

The full flow across 4 files:

```
rag.py              → retrieve_context() now returns text + metadata (filename, page)
chat.py             → builds sources list, yields it as a named SSE event after tokens
useChat.ts          → parses the "sources" SSE event, attaches sources to the message
MessageBubble.tsx   → renders Source: filename · page N below the answer
```

### SSE Event Format

After all answer tokens stream, the backend sends one extra SSE event:

```
event: sources
data: [{"filename": "faq.pdf", "page": 3}]

data: [DONE]
```

The frontend distinguishes it from regular tokens by checking for `event: sources` in the raw stream.

---

## Files Changed

### `backend/app/services/rag.py`
`retrieve_context()` previously returned only text strings, discarding metadata. Changed to return dicts:

```python
return [
    {
        "text": point.payload["text"],
        "source": point.payload.get("source", "unknown"),
        "page": point.payload.get("page", None),
    }
    for point in response.points
]
```

`stream_answer()` signature updated to accept `chunks` as a parameter (retrieved in `chat.py` instead of inside `rag.py`).

### `backend/app/routes/chat.py`
Sources are built and sent from `chat.py` directly, outside the streaming generator:

```python
async def chat(request: Request, body: ChatRequest):
    chunks = retrieve_context(body.question)

    seen = set()
    sources = []
    for c in chunks:
        if c["source"] not in seen:
            seen.add(c["source"])
            sources.append({
                "filename": c["source"],
                "page": c["page"] + 1 if c["page"] is not None else None
            })

    sources_json = json.dumps(sources)

    def event_stream():
        for token in stream_answer(body.question, chunks):
            safe_token = token.replace("\n", "\\n")
            yield f"data: {safe_token}\n\n"
        yield f"event: sources\ndata: {sources_json}\n\n"
        yield "data: [DONE]\n\n"
```

### `frontend/src/types/index.ts`
Added `sources` field to the `Message` type:

```typescript
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  sources?: { filename: string; page: number | null }[]
}
```

### `frontend/src/hooks/useChat.ts`
Updated SSE parsing to handle the named `sources` event alongside regular `data:` tokens:

```typescript
if (line === "event: sources") {
  const dataLine = lines[i + 1] ?? ""
  if (dataLine.startsWith("data: ")) {
    const sources = JSON.parse(dataLine.replace("data: ", ""))
    setMessages(prev =>
      prev.map(m =>
        m.id === assistantMessage.id ? { ...m, sources } : m
      )
    )
  }
  i += 2
  continue
}
```

### `frontend/src/components/MessageBubble.tsx`
Citations rendered in muted small text below the answer, separated by a border:

```tsx
{!isUser && !message.isStreaming && message.sources && message.sources.length > 0 && (
  <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 space-y-0.5">
    {message.sources.map((s, i) => (
      <p key={i} className="text-xs text-gray-400 dark:text-gray-500">
        Source: {s.filename}{s.page !== null ? ` · page ${s.page}` : ""}
      </p>
    ))}
  </div>
)}
```

---

## Issues We Hit (and How We Fixed Them)

### Issue 1: Sources event never appeared in the SSE stream

**Symptom:** EventStream tab in DevTools showed tokens then `[DONE]` with nothing in between. No `sources` event at all.

**Root cause:** The original approach yielded `__SOURCES__` from inside `stream_answer()` in `rag.py`, after the Groq streaming loop. FastAPI's `StreamingResponse` with a sync generator silently stops consuming the generator after the inner Groq stream exhausts — the code after the loop never ran.

**Fix:** Moved all sources logic out of `rag.py` entirely. `chat.py` now calls `retrieve_context()` directly in the `async` function scope (before the generator starts), builds the sources list there, and captures it in `sources_json`. The generator only handles token streaming and yields the pre-built string at the end.

**Lesson:** In FastAPI's `StreamingResponse` with a sync generator, any exception or early termination inside a nested generator kills the outer generator silently. Keep post-stream logic outside the generator.

---

### Issue 2: `[DONE]` sentinel cutting off the sources event

**Symptom:** Even after fixing Issue 1, sources still didn't appear. The frontend's `break` on `[DONE]` was exiting the inner parsing loop, causing it to miss the sources event that arrived in the same or next chunk.

**Fix:** Removed the `break` on `[DONE]` — replaced with `i++; continue` so the inner loop finishes naturally. The outer `while(true)` reader loop exits when the stream closes (`done = true`), not on `[DONE]`. Also moved sources before `[DONE]` in the backend so they always arrive first.

---

### Issue 3: Docker containers intercepting requests during local dev

**Symptom:** All debugging showed no effect — `print()` statements never appeared, `debug.log` was never created, file changes had no effect. But the app was still working and serving responses.

**Root cause:** `docker compose up` had been run earlier, leaving `docpilot-backend` (port 8000) and `docpilot-frontend` (port 3000) containers running. All browser requests were hitting the old Docker images, not the locally running uvicorn/Next.js processes.

**Fix:** `docker compose down` to stop all containers, then start only Qdrant for local dev. Local uvicorn and `npm run dev` then receive requests correctly.

**Lesson:** Always run `docker compose down` before switching to local development. Check `docker ps` if file changes seem to have no effect.

---

### Issue 4: Page numbers showing as 0-indexed

**Symptom:** Citations showed `page 0`, `page 2` etc. instead of `page 1`, `page 3`.

**Root cause:** PyPDFLoader stores page numbers as 0-based indices in chunk metadata. Page 0 = actual page 1.

**Fix:** Added `+1` when building the sources list in `chat.py`:
```python
"page": c["page"] + 1 if c["page"] is not None else None
```

---

### Issue 5: Multiple citations from the same filename

**Symptom:** Same filename appeared 2-3 times in citations (different pages), making it noisy.

**Root cause:** Original deduplication was by `(filename, page)` pair — so the same file appearing on different pages would show multiple times.

**Fix:** Changed deduplication to by filename only — each source file appears once, showing the page of its first retrieved chunk.

---

### Issue 6: Qdrant container not port-mapped for local dev

**Symptom:** After `docker compose down`, running `docker start qdrant` started the original standalone Qdrant container which had no port mapping (`-p 6333:6333`), causing backend startup to fail with `ConnectError`.

**Fix:** Created a new container with explicit port mapping:
```powershell
docker run -d -p 6333:6333 --name qdrant-local qdrant/qdrant
```

For local dev, always use `docker start qdrant-local` instead of `docker start qdrant`.

---

## Running Locally (Updated)

```powershell
# Terminal 1 — Qdrant
docker start qdrant-local

# Terminal 2 — Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Note: do NOT use `docker compose up` for local development — it will intercept your requests with the old built images.