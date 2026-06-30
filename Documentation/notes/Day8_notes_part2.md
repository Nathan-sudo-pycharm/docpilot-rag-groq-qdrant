# DocPilot — Day 8 Part 2 Engineering Notes

**Date:** Day 8 (continued session)  
**Branch:** `day/08-theming-polish`  
**Status:** ✅ Complete, merged to main, tagged `v0.6.0`

> This continues directly from `day8-notes.md` (theming and visual polish). This session focused on a real production bug discovered during manual testing, plus two small UX additions.

---

## What Was Built Today

### 1. Critical Bug: Sidebar/Qdrant State Drift

**How it was discovered:** while testing, a freshly uploaded PDF (`service-cancellation-confirmation.pdf`) was asked "what is this document about?" — but the streamed answer described a completely different, much older test document (a university rejection letter). The sidebar showed only the new document, yet the answer clearly came from old data.

**Root cause:** the document sidebar was pure frontend session state (`useState<Document[]>([])` inside `useDocuments`), with zero connection to what was actually stored in Qdrant. Every PDF ever uploaded across every testing session remained in Qdrant permanently, unless explicitly deleted via the sidebar's X button *during that exact browser session*. Refreshing the page, or starting a new session, reset the sidebar to a clean slate — while Qdrant's actual data kept accumulating. Confirmed via direct query: Qdrant held **34 points**, while the new upload only contributed 5 — meaning 29 leftover chunks from earlier sessions were still being searched and were dominating retrieval results.

**Decision considered but rejected:** scoping retrieval to a "session" (e.g., via a generated session ID). Rejected because it would require inventing a notion of sessions this app was never designed around, and conceptually fights against the product's actual design — a single shared knowledge base is the intended behavior for a support-agent tool, not a bug. This limitation is already documented in the README ("No multi-user support — one shared knowledge base").

**Fix implemented:**
- **Backend:** new `GET /ingest` endpoint added to `routes/ingest.py`. Since Qdrant has no native "list distinct payload values" query, the endpoint uses `client.scroll()` to page through all points in batches of 100, aggregating chunk counts by the `source` field in Python. Returns a list of `{filename, chunk_count}` objects representing ground truth.
- **Frontend:** `useDocuments.ts` now calls this endpoint inside a `useEffect(() => {...}, [])` — the empty dependency array means this runs exactly once, when the component first mounts, fetching the real current state instead of starting empty.
- Added `isLoadingDocuments` boolean state so the sidebar shows "Loading documents..." during that initial fetch, rather than briefly flashing "No documents yet" before the real data arrives.

**Verification:** after wiping the collection clean and re-testing, removing a document from the sidebar and then asking about it correctly returned "I don't have information about that" — confirming retrieval now accurately reflects only what's genuinely present in Qdrant.

### 2. File Mix-Up During Implementation

While pasting the updated `useDocuments` hook code, it was accidentally pasted into `DocumentSidebar.tsx` instead of `useDocuments.ts` — overwriting the sidebar component entirely with hook logic. Diagnosed by comparing the contents of both files side by side (`cat` on each), confirming `useDocuments.ts` still held the old pre-fix version while `DocumentSidebar.tsx` held hook code instead of UI markup. Both files were rebuilt cleanly from scratch in the same session. No lasting damage — caught immediately via a build error from the misplaced `listDocuments` import inside the wrong file.

### 3. Backend Connection Failure (Separate, Unrelated Issue)
While debugging the above, a second issue surfaced: `httpcore.ConnectError: [WinError 10061] No connection could be made because the target machine actively refused it` on backend startup. This was simply the Qdrant Docker container not running — confirmed and fixed with `docker ps` (showed nothing) → `docker start qdrant`. Included here as a reminder that "Failed to fetch" / connection errors in the frontend should always prompt checking whether the backend process itself is alive before assuming a code bug.

### 4. UX Polish — Delete Button
- Replaced the plain `✕` text character with `lucide-react`'s `Trash2` icon — more polished, consistent with the `Sun`/`Moon` icons already used in `ThemeToggle`
- Added explicit `cursor-pointer` class — the hand cursor wasn't appearing on hover despite being a `<button>` element, likely due to other styling implicitly overriding the default cursor behavior

### 5. New Feature: Clear Chat
- `useChat.ts` — added `clearChat()`, a simple `setMessages([])`. No backend call needed since chat messages were always frontend-only state (unlike documents, which persist in Qdrant)
- Wired into `page.tsx`'s header, positioned next to `ThemeToggle`
- Conditionally rendered with `{messages.length > 0 && (...)}` — the button doesn't exist in the DOM at all when there's nothing to clear, rather than existing in a disabled state
- Styled with a subtle border (`border-gray-200 dark:border-gray-700`, hover state slightly darker/lighter) to read as a proper interactive button rather than floating unstyled text

---

## Folder Structure After This Session

```
docpilot-rag-groq-qdrant/
├── backend/
│   └── app/routes/ingest.py          ← + GET /ingest (list documents)
├── frontend/src/
│   ├── app/page.tsx                  ← + Clear chat button in header
│   ├── components/
│   │   └── DocumentSidebar.tsx       ← rebuilt: loading state, Trash2 icon, cursor fix
│   ├── hooks/
│   │   ├── useChat.ts                ← + clearChat()
│   │   └── useDocuments.ts           ← rebuilt: fetches real state on mount via useEffect
│   ├── types/index.ts                ← + DocumentSummary
│   └── lib/api.ts                    ← + listDocuments()
└── Documentation/
```

---

## Concepts Learned This Session

### State drift between frontend and backend
When a UI maintains its own copy of data that also exists independently on a server (here: "what documents are loaded" tracked both in React state AND in Qdrant), the two can silently diverge — the UI keeps showing what it remembers from its own session, while the actual backend data changes independently (new uploads from other sessions, manual testing, etc.). The fix pattern is standard: on mount, fetch the real current state from the server and use that as the source of truth, rather than assuming frontend state is authoritative. `useEffect(() => {...}, [])` is the correct hook for "run this once when the component first appears" — used here specifically for this initial sync.

### Qdrant's `scroll()` for listing without a native query
Qdrant doesn't provide a "list distinct payload field values" operation directly. `client.scroll()` retrieves points in pages (controlled by `limit` and `offset`), making it possible to walk through an entire collection's payloads and aggregate them in application code. This is a reasonable approach at the chunk-count scale this project operates at, but would need a different strategy (e.g., a separate "documents" collection/table) at much larger scale.

### Diagnosing "Failed to fetch" errors
A `TypeError: Failed to fetch` with no HTTP status code in the browser almost always means the request never reached a server at all — not a 4xx/5xx response, but a complete connection failure. The fix is never in the frontend code in these cases; it means checking whether the backend process is actually running and reachable on the expected port first.

---

## Bugs Found and Fixed This Session

| Bug | Cause | Fix |
|---|---|---|
| Chat answers reflect old, deleted-from-UI documents | Sidebar was frontend-only state, disconnected from Qdrant's actual persistent data (34 leftover points vs. 5 from the new upload) | New `GET /ingest` endpoint + `useEffect` fetch-on-mount in `useDocuments` |
| `DocumentSidebar.tsx` accidentally overwritten with hook code | Copy-paste error — content meant for `useDocuments.ts` pasted into the wrong file | Both files rebuilt from scratch, verified via `cat` comparison |
| `httpcore.ConnectError` on backend startup | Qdrant Docker container had stopped running | `docker start qdrant` |
| Delete button missing hand cursor on hover | `cursor-pointer` not explicitly set, default button cursor behavior overridden by other styles | Added explicit `cursor-pointer` class |

---

## Commits Made This Session

```
feat(backend): GET /ingest - list documents endpoint to sync sidebar with real Qdrant state
feat(frontend): add DocumentSummary type
feat(frontend): add listDocuments API client function
fix(frontend): fetch real document list on mount instead of starting empty - fixes stale sidebar bug
feat(frontend): loading state, Trash2 icon, cursor-pointer fix for delete button
feat(frontend): add clearChat function
feat(frontend): Clear chat button with border styling, wired to header
```

## Tag Created
```
v0.6.0 — "Fix sidebar sync bug, add document list endpoint, clear chat, UI polish"
```

---
