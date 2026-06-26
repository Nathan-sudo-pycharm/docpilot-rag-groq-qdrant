# DocPilot — Design Reference

Visual spec extracted from the Emergent-generated UI mockup. Use this as the source of truth when building real components on Day 7+.

---

## Reference Screenshots

Saved separately by Nathan in the project. Two states captured:
1. Light theme — full chat with documents loaded, citations visible
2. Dark theme — same content, theme toggle in top-right (sun/moon icon)

---

## Typography

**Assistant message / monospace text:**
```
Font:        Geist Mono
Fallback:    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace
Weight:      400
Size:        13px
Line height: 21px
Color (dark mode): rgb(242, 242, 242)
```

**General UI text (headers, labels, sidebar):** clean sans-serif — likely Geist Sans or Inter based on the look. Confirm exact font when implementing, but Geist Sans is the safe match since Geist Mono is explicitly used elsewhere.

---

## Layout Structure

```
┌─────────────────┬──────────────────────────────────────────┐
│ SIDEBAR (~270px) │ CHAT AREA (flexible width)                │
│                  │                                            │
│ DocPilot [BETA]  │ Ask anything              [Clear chat] [☀/☾]│
│ subtitle         │ "3 documents loaded · 4 messages"          │
│                  │                                            │
│ ┌──────────────┐ │ ┌──────────────────────────────┐          │
│ │ Drop PDF here│ │ │                    [user msg] │          │
│ │ or browse    │ │ └──────────────────────────────┘          │
│ │ up to 25MB   │ │ ┌──────────────────────────────┐          │
│ └──────────────┘ │ │ [assistant msg]                │          │
│                  │ │ Source: file.pdf · page 12     │          │
│ DOCUMENTS    3   │ │ Source: file2.pdf · page 3     │          │
│ • file1.pdf      │ └──────────────────────────────┘          │
│   184 chunks·6m  │                                            │
│ • file2.pdf      │                                            │
│   62 chunks·47m  │                                            │
│ ○ file3.pdf      │ ┌──────────────────────────────────────┐  │
│   indexing...5h  │ │ Ask a question...              [→]   │  │
│                  │ │ Press Enter to send · Shift+Enter... │  │
│ v0.1.0·build2026 │ └──────────────────────────────────────┘  │
└─────────────────┴──────────────────────────────────────────┘
```

---

## Color Palette

### Light Theme
| Element | Approx Value |
|---|---|
| Background | white / near-white |
| Sidebar border | light gray (`border-gray-200` range) |
| Document status dot (indexed) | green |
| Document status dot (indexing) | amber/orange |
| User message bubble | blue (`bg-blue-600` range) |
| User message text | white |
| Assistant message bubble | light gray card |
| Assistant message text | dark gray / near-black |
| Citation text | muted gray, small size |
| Primary button (send) | blue, matches user bubble |

### Dark Theme
| Element | Approx Value |
|---|---|
| Background | true near-black (`#0a0a0a` range — NOT navy, NOT dark gray) |
| Sidebar border | subtle dark gray |
| Document status dot (indexed) | green (same as light) |
| Document status dot (indexing) | amber/orange (same as light) |
| User message bubble | blue (same blue as light theme) |
| User message text | white |
| Assistant message bubble | dark gray card (`#1a1a1a` range) |
| Assistant message text | `rgb(242, 242, 242)` — confirmed from font inspection |
| Citation text | muted gray, small size |
| Primary button (send) | blue, same as light |

**Key insight:** the blue accent color stays IDENTICAL between light and dark mode — only backgrounds and card surfaces change. This is the Vercel pattern: one accent, consistent across themes.

---

## Component Details

### Sidebar Header
- "DocPilot" wordmark, bold, normal text size
- Small "BETA" pill badge next to it — light background, small rounded corners, tiny uppercase text
- Subtitle below: "RAG-powered support agent" — muted, small

### Upload Zone
- Dashed border box, compact (not oversized)
- Upload icon (arrow pointing up into a tray) centered
- Text: "Drop PDF here or **browse**" — the word "browse" is a clickable link styled in the accent blue
- Secondary line: "PDF up to 25 MB" — muted, smaller

### Document List Item
- Status dot (left) — green filled circle (indexed), amber/orange filled circle (indexing), small file-type icon shown separately to the left of the dot in some states
- Filename — truncated with ellipsis if too long
- Metadata line below: "184 chunks · 6m ago" — muted, small
- Indexing state shows "indexing..." instead of chunk count, with a different (spinning?) icon

### Chat Header
- "Ask anything" — bold, larger than body text
- Subtitle: "3 documents loaded · 4 messages" — muted, small, dynamic count
- Right side: "Clear chat" text button (muted/outline style) + theme toggle icon button (sun in dark mode, moon in light mode — shows the icon for the mode you'd switch TO)

### Message Bubbles
- User: right-aligned, blue background, white text, rounded corners (moderate radius, not pill-shaped), max-width constraint so long messages wrap rather than stretch full width
- Assistant: left-aligned, card background (light gray / dark gray depending on theme), monospace font (Geist Mono, 13px/21px), same max-width constraint
- Citations: appear BELOW the assistant message content, inside or just under the same card, each on its own line, format: `Source: filename.pdf · page N` — muted gray, smaller than body text, multiple sources stack vertically if multiple chunks were used

### Input Bar
- Single-line input field (expands for Shift+Enter newlines per the helper text), placeholder "Ask a question about your documents..."
- Send button: small square-ish button, arrow-up icon, blue accent background, positioned at the right edge of the input
- Helper text below input: "Press Enter to send · Shift+Enter for newline" — muted, small

### Footer (sidebar bottom)
- Version/build info: "v0.1.0 · build 2026.02" — very muted, smallest text on the page

---

## Behavioral Notes

- Citations support MULTIPLE sources per answer (two `Source:` lines shown stacked for one response) — **this requires a backend change**. Currently `/chat` only streams the answer text; it does not return which chunks were used. To support real citations, the backend would need to also send back the source metadata (filename + page) for the chunks that were retrieved, likely as a final SSE event after the answer text, e.g. `data: {"sources": [...]}` before `[DONE]`.
- Document list shows three distinct states: indexed (green dot, shows chunk count), indexing (amber dot, shows "indexing..."), and presumably an error state not shown in these screenshots (would need a red/error treatment for consistency)
- Theme defaults to OS preference (`prefers-color-scheme` media query), with manual override via the toggle button persisted for the session

---

## Implementation Plan (Day 7+)

1. Set up a theme provider (likely `next-themes` package) to handle the light/dark toggle + OS preference detection
2. Rebuild `MessageBubble.tsx` with Geist Mono font, exact color values above
3. Build `FileUploader.tsx` matching the compact dashed-border upload zone style
4. Build a `DocumentList.tsx` / `Sidebar.tsx` component with the three status states
5. Add the "Clear chat" button functionality (simple — just reset the `messages` state in `useChat`)

## Citations — Deferred to Post-Launch (v1.1)

**Decision:** Ship the core 14-day build WITHOUT real multi-source citations. The mockup shows them, but implementing them requires a backend change (returning chunk source metadata alongside the streamed answer).

**Plan:** Roughly 2 days after the main build wraps, add citations as a dedicated v1.1 feature. This is a deliberate choice — it lets the core MVP ship clean and complete on schedule, then citations become a clearly-labeled "iteration after launch" feature, which is a stronger portfolio story than cramming everything into the original timeline.

**What v1.1 will need when we get there:**
- Backend: `stream_answer()` in `rag.py` needs to also yield the source metadata (filename + page) for the chunks that were retrieved — likely as one extra SSE event sent after the answer text but before `[DONE]`, e.g. `data: {"sources": [...]}`
- Frontend: `useChat.ts` needs to parse that extra event type and attach it to the assistant message object
- `MessageBubble.tsx` needs a small addition to render the `Source: file.pdf · page N` lines under the answer, matching the muted small-text style from the mockup