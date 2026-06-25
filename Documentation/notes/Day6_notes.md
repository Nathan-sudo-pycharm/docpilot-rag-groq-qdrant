# DocPilot — Day 6 Engineering Notes

**Date:** Day 6  
**Branch:** `day/06-chat-ui`  
**Status:** ✅ Complete, merged to main, tagged `v0.3.0`

---

## 🎉 Milestone: Full RAG Chat Working End-to-End

This is the day DocPilot became a real product instead of a collection of separate working pieces. Type a question in the browser → real backend call → real Qdrant retrieval → real Groq generation → real token-by-token streaming into a dark-themed chat UI. Verified live with two real questions, including a correct "I don't know" response when asked something outside the document's content — proof the RAG grounding works exactly as intended.

---

## What Was Built Today

### 1. `useChat` Hook
- `frontend/src/hooks/useChat.ts`
- Manages the `messages` array and `isLoading` state
- `sendMessage()` — adds an optimistic user message + an empty streaming assistant placeholder, then reads the SSE response body chunk by chunk using `ReadableStream.getReader()`
- Parses `data: token` lines, appends each token to the assistant message's content in real time
- Detects the `[DONE]` sentinel from the backend to flip `isStreaming` off

### 2. `MessageBubble` Component
- `frontend/src/components/MessageBubble.tsx`
- Renders a single message, styled differently for user (purple, right-aligned) vs assistant (dark card, left-aligned)
- Shows a pulsing dot while waiting for the first token, and a blinking cursor while actively streaming

### 3. Chat Page
- `frontend/src/app/page.tsx` — replaced the default Next.js starter entirely
- Dark theme (`#0f0f0f` background, `#7c3aed` purple accents) matching the v0 design reference
- Auto-scrolls to the latest message via `useRef` + `useEffect`
- Form submission clears the input immediately and calls `sendMessage()`

### 4. Live Browser Test — Confirmed Working
- Asked an irrelevant question ("dgt") → correctly got "I don't have information about that in the provided documents" — **no hallucination**
- Asked "what is the document about?" → got an accurate, specific, grounded answer referencing the actual ingested PDF content (Technische Hochschule Bingen rejection letter)
- Tokens visibly streamed in rather than appearing all at once

---

## Folder Structure After Day 6

```
docpilot-rag-groq-qdrant/
├── backend/                          ← complete since Day 4
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx              ← full chat UI, replaces default starter
│   │   ├── components/
│   │   │   └── MessageBubble.tsx     ← message rendering + streaming cursor
│   │   ├── hooks/
│   │   │   └── useChat.ts            ← SSE streaming logic, message state
│   │   ├── types/index.ts
│   │   └── lib/api.ts
│   └── .env.local
├── qdrant_storage/
└── Documentation/
```

---

## TypeScript / React Concepts Learned Today

### Props and destructuring
A component receives data from its parent through "props" (short for properties) — conceptually identical to function parameters in plain JavaScript:
```typescript
function greet(name) { ... }        // JS function parameter
function MessageBubble({ message }: Props) { ... }   // React component "prop"
```
`interface Props { message: Message }` declares the required shape of the incoming data. The `{ message }` syntax is "destructuring" — pulling the `message` field directly out of the props object instead of writing `props.message` everywhere.

### `useState<Message[]>`
The `<Message[]>` is a generic type parameter — it tells TypeScript exactly what kind of values this state array is allowed to hold. Any attempt to push a wrongly-shaped object into `messages` gets caught by the compiler before the code even runs.

### `useCallback` and the empty dependency array
`useCallback(fn, [])` tells React "keep this exact same function reference across re-renders, since it doesn't depend on anything that changes." Without this, a new version of `sendMessage` would be created every time the component re-renders, which can cause unnecessary work or stale closures in more complex components.

### `useRef` + `useEffect` for auto-scroll
`useRef(null)` creates a persistent reference to a DOM element that survives across re-renders (unlike regular state, updating a ref does NOT trigger a re-render). Attaching `ref={bottomRef}` to an invisible div at the bottom of the message list lets us call `.scrollIntoView()` on it. `useEffect(() => {...}, [messages])` re-runs that scroll command every time the `messages` array changes — i.e., every time a new token arrives.

### `res.body!.getReader()`
`res.body` is a `ReadableStream` — a stream of raw bytes arriving over time, not a regular string. `.getReader()` gives us a controller object to pull chunks of those bytes out one at a time as they arrive over the network, instead of waiting for the entire response to finish downloading first. This is the actual mechanism that makes token-by-token streaming possible in the browser.

### Why `EventSource` wasn't used
Browsers have a built-in `EventSource` API specifically designed for Server-Sent Events — but it only supports `GET` requests. Since we need to send the question as a JSON body, we have to use `POST`, which means we build the SSE parsing manually with `fetch` + `ReadableStream` instead of relying on the built-in API.

### `React.FormEvent` and `e.preventDefault()`
By default, submitting an HTML form reloads the entire page — leftover behavior from how the web worked before JavaScript. `e.preventDefault()` stops that default behavior so we can handle the submission ourselves in JavaScript/React instead.

---

## Commits Made Today

```
feat(frontend): useChat hook with SSE streaming parser
feat(frontend): MessageBubble component with streaming cursor
feat(frontend): chat page wired to live backend, full RAG flow working
```

## Tag Created
```
v0.3.0 — "Full RAG chat working end-to-end: real UI, streaming, grounded answers"
```

---