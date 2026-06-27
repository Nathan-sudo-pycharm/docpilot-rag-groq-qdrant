# DocPilot — Day 7 Engineering Notes

**Date:** Day 7  
**Branch:** `day/07-upload-ui`  
**Status:** ✅ Complete, merged to main, tagged `v0.4.0`

---

## 🎉 Milestone: Core Product Complete

This is the day DocPilot became a real, usable product rather than a proof-of-concept. The full loop now works: upload a document through a real UI, see it tracked in a sidebar, ask questions grounded in it, delete it when done — with the UI correctly reflecting every state change along the way.

---

## What Was Built Today

### 1. Backend: Document Deletion
- New route added to `backend/app/routes/ingest.py`: `DELETE /ingest/{filename}`
- Deletes all chunks belonging to a document by filtering on the `source` field already stored in every chunk's payload since Day 3
- Used Qdrant's `Filter` + `FieldCondition` + `MatchValue` to delete-by-filter rather than needing to track individual point IDs
- Tested live: confirmed point count dropped from 8 to 0 after deleting a previously-ingested PDF

### 2. Frontend: Document Type and API Client
- `frontend/src/types/index.ts` — added `Document` interface (`filename`, `chunkCount`, `uploadedAt`)
- `frontend/src/lib/api.ts` — added `deleteDocument(filename): Promise<void>`

### 3. Frontend: `useDocuments` Hook
- `frontend/src/hooks/useDocuments.ts`
- Manages a `documents` array — frontend-only session state, since there's no backend "list documents" endpoint
- `uploadDocument()` — calls `ingestDocument()`, then prepends a new `Document` object to the list
- `removeDocument()` — calls `deleteDocument()`, then filters the document out of local state

### 4. `FileUploader` Component
- `frontend/src/components/FileUploader.tsx`
- Drag-and-drop zone + browse link, compact dashed-border style matching the design reference
- Receives `onUpload` as a prop rather than calling the API directly — a deliberate separation of concerns (the component only detects file selection; the parent/hook owns what happens with that file)

### 5. `DocumentSidebar` Component
- `frontend/src/components/DocumentSidebar.tsx`
- Renders the `FileUploader` plus the live document list
- Each document shows a status dot, truncated filename, chunk count, and relative timestamp ("6m ago")
- Hover-to-reveal delete button (X) using the Tailwind `group`/`group-hover` pattern
- `formatRelativeTime()` helper — plain TypeScript function (not a component) converting a `Date` into a friendly string

### 6. Full Page Wiring
- `frontend/src/app/page.tsx` rebuilt entirely into the two-panel layout: `DocumentSidebar` on the left, chat on the right
- Header dynamically shows document and message counts
- Send button and input disabled when no documents are loaded
- **Bug found and fixed same day:** the "upload a document" empty state only showed when `messages.length === 0`, so deleting the only document mid-conversation left no indication that chat was now non-functional. Fixed by adding a persistent amber warning above the input bar that shows whenever `documents.length === 0`, independent of message history.

### 7. Live Browser Tests — All Confirmed Working
- Uploaded a new PDF via drag-and-drop → appeared in sidebar instantly with correct chunk count and "just now" timestamp
- Asked a question → got an accurate, grounded answer from the new document
- Deleted the document via the hover X → document count dropped to 0, chat history preserved, new warning message appeared
- Tested a mixed English/Hindi follow-up question ("ok toh usse admission nahi milega right?") → Llama 3 correctly responded in the same mixed style — incidental confirmation of decent multilingual handling, not something we specifically engineered for

---

## Folder Structure After Day 7

```
docpilot-rag-groq-qdrant/
├── backend/
│   └── app/routes/ingest.py          ← + DELETE /ingest/{filename}
├── frontend/
│   ├── src/
│   │   ├── app/page.tsx              ← full two-panel layout
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── FileUploader.tsx      ← NEW
│   │   │   └── DocumentSidebar.tsx   ← NEW
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   └── useDocuments.ts       ← NEW
│   │   ├── types/index.ts            ← + Document interface
│   │   └── lib/api.ts                ← + deleteDocument()
│   └── .env.local
└── Documentation/
```

---

## React/TypeScript Concepts Learned Today

### "Lifting state up" / separation of concerns
`FileUploader` doesn't know anything about our backend, Qdrant, or the `Document` type — it only detects a file drop or selection and calls whatever `onUpload` function its parent gave it. The actual logic (calling the API, updating the document list) lives in `useDocuments`, one level up. This means `FileUploader` could be reused in a completely different project without modification. The pattern: dumb/presentational components receive data and callback functions as props; smart components/hooks own the actual state and logic.

### The `prev =>` updater function pattern
```typescript
setDocuments(prev => prev.filter(doc => doc.filename !== filename))
```
Using a function that receives the previous state (`prev`) and returns the new state is safer than reading the `documents` variable directly, because React batches state updates — the `documents` variable in your component might be a stale snapshot from the last render, while `prev` inside the updater function is guaranteed to be the actual latest value at the moment the update is applied.

### The `key` prop on rendered lists
Every time you use `.map()` to render a list of elements, React requires a `key` prop on each one — a stable, unique identifier (here, `doc.filename`). This lets React track which specific item is which across re-renders, so it can efficiently update, add, or remove individual list items instead of re-rendering the entire list from scratch every time.

### Tailwind's `group` / `group-hover` pattern
Adding `className="group"` to a parent element lets any descendant use `group-hover:` classes that respond to hovering over the PARENT, not just the element itself. Used here so the delete (✕) button stays invisible (`opacity-0`) until the user hovers anywhere over that document's row (`group-hover:opacity-100`), avoiding visual clutter when not needed.

### `React.DragEvent<HTMLDivElement>` and `React.ChangeEvent<HTMLInputElement>`
These are TypeScript's way of saying "this is specifically a drag event on a div" or "specifically a change event on an input element." Being this specific means TypeScript knows exactly which properties are available on the event object (e.g., `e.dataTransfer.files` only makes sense on a drag event, not a generic one), and will warn you if you try to access something that doesn't exist on that particular event type.

### Optional chaining with array access: `e.target.files?.[0]`
`e.target.files` could technically be `null` (if no file was selected). The `?.` operator short-circuits the entire expression to `undefined` if the thing before it is null/undefined, instead of throwing a runtime error trying to access `[0]` on `null`.

---

## Bug Found and Fixed

| Bug | Cause | Fix |
|---|---|---|
| No indication that chat is non-functional after deleting the only loaded document mid-conversation | Empty-state warning only checked `messages.length === 0`, which becomes false after the first message and stays false even if all documents are later deleted | Added a separate, persistent warning that checks `documents.length === 0` independently, shown right above the input bar regardless of message history |

---

## Commits Made Today

```
feat(backend): DELETE /ingest/{filename} - removes document chunks from Qdrant
feat(frontend): add deleteDocument to API client
feat(frontend): add Document type for sidebar tracking
feat(frontend): useDocuments hook - upload and delete document state
feat(frontend): FileUploader component with drag-and-drop
feat(frontend): DocumentSidebar with delete-on-hover
feat(frontend): wire sidebar + chat into full two-panel layout
fix(frontend): show persistent warning when no documents loaded, not just on empty chat
```

## Tag Created
```
v0.4.0 — "Full upload + sidebar + delete UI, two-panel layout complete"
```
