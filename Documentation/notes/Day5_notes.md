# DocPilot — Day 5 Engineering Notes

**Date:** Day 5  
**Branch:** `day/05-frontend-setup`  
**Status:** ✅ Complete, merged to main

---

## What Was Built Today

Frontend work begins. No UI yet — just the typed foundation that Day 6 and 7's components will sit on top of.

### 1. TypeScript Types
- `frontend/src/types/index.ts`
- `Message` interface — `id`, `role` (union type: `"user" | "assistant"`), `content`, optional `isStreaming`
- `IngestResponse` interface — matches the exact shape returned by the backend's `POST /ingest`

### 2. Environment Variable
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_` prefix required for Next.js to expose the variable to browser-side code

### 3. Typed API Client
- `frontend/src/lib/api.ts`
- `ingestDocument(file: File): Promise<IngestResponse>` — wraps a `FormData` POST request to `/ingest`
- Return type guarantees the rest of the app gets a correctly-shaped object back, or an error is thrown

### 4. Infrastructure Fixes
- **Smart App Control (Windows 11)** started blocking `grpc`'s compiled DLL (`cygrpc.pyd`), breaking `qdrant-client` imports entirely — this had nothing to do with our code, it was a Windows security feature re-evaluating a previously-allowed file. Disabled via Settings → Privacy & security → Windows Security → App & browser control.
- **`.gitignore` bug:** the root `.gitignore` had a generic `lib/` rule (intended for Python virtual environments) that was unintentionally matching `frontend/src/lib/` too, since gitignore patterns without a leading `/` match at any folder depth. Fixed by scoping it to `backend/venv/lib/` specifically.

---

## Folder Structure After Day 5

```
docpilot-rag-groq-qdrant/
├── backend/                        ← unchanged, fully complete since Day 4
├── frontend/
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts            ← Message, IngestResponse
│   │   └── lib/
│   │       └── api.ts              ← ingestDocument()
│   ├── .env.local                  ← gitignored
│   └── package.json
├── qdrant_storage/
└── Documentation/
```

---

## TypeScript Concepts Learned Today

### Interfaces are contracts, not suggestions
```typescript
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}
```
Any object claiming to be a `Message` must have exactly these fields with exactly these types. The TypeScript compiler checks this at build time — wrong field names or types get caught before the code ever runs, unlike plain JavaScript where a typo silently produces `undefined`.

### Union types restrict to exact allowed values
`role: "user" | "assistant"` means this field can only ever be one of those two literal strings — not any string. Trying to assign `role: "bot"` would be a compile error. This is stricter (and safer) than JavaScript's "anything goes" approach to object fields.

### The optional `?` modifier
`isStreaming?: boolean` means this field may or may not be present on the object. Without the `?`, every single `Message` object would be required to explicitly include `isStreaming`, even when it's irrelevant (like for already-finished messages).

### The non-null assertion operator `!`
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL!
```
Environment variables are typed as `string | undefined` by default, since TypeScript can't know for certain they'll be set. The `!` tells the compiler "trust me, this will exist" — skipping the undefined-check TypeScript would otherwise force. Used carefully, only when you're certain the value is set (as we are here, since we just defined it in `.env.local`).

### Why `FormData` doesn't need a manual `Content-Type` header
Browsers automatically set the correct `Content-Type: multipart/form-data; boundary=...` header when sending a `FormData` object — including a unique "boundary" string the server uses to separate the file data from other form fields. Manually setting this header yourself would override the automatic boundary, breaking the upload.

---

## Other Concepts Learned

### Why gitignore patterns without a leading slash are dangerous
A pattern like `lib/` (no leading slash) matches a folder named `lib` **anywhere** in the project — `backend/venv/lib/`, `frontend/src/lib/`, even a future `something/else/lib/`. A pattern like `/lib/` (with a leading slash) only matches `lib/` at the project root. Generic `.gitignore` templates (like the default Python one) are written assuming a single-language repo — multi-language projects like this one need to audit and scope these rules carefully.

### Windows Smart App Control can silently break working code
This is the second Windows-specific environment issue encountered in this project (the first was the VC++ Redistributable for PyTorch on Day 3). Smart App Control re-evaluates previously-allowed files over time and can start blocking them without any code change on your end. When something that worked yesterday suddenly throws a DLL/Application Control error today, check Windows Security settings before assuming the code broke.

---

## Commits Made Today

```
feat(frontend): TypeScript interfaces for Message and IngestResponse
feat(frontend): typed API client for ingest endpoint
fix: scope lib/ gitignore rule to backend/venv only, was blocking frontend/src/lib
```

---
