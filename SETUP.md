# Setup Guide — DocPilot

This guide gets DocPilot running on your local machine. No paid services required — everything runs locally except the LLM inference, which uses Groq's free tier.

---

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Docker | Any recent version | `docker --version` |
| Git | Any recent version | `git --version` |

You'll also need a free Groq API key — sign up at [console.groq.com](https://console.groq.com), no credit card required.

---

## 1. Clone the Repository

```bash
git clone https://github.com/Nathan-sudo-pycharm/docpilot-rag-groq-qdrant.git
cd docpilot-rag-groq-qdrant
```

---

## 2. Start Qdrant (Vector Database)

Run this from the project root:

```bash
docker run -d --name qdrant -p 6333:6333 -v ${PWD}/qdrant_storage:/qdrant/storage qdrant/qdrant
```

Confirm it's running by visiting `http://localhost:6333/dashboard` in your browser.

**On subsequent runs**, you don't need to recreate the container — just start it:
```bash
docker start qdrant
```

---

## 3. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
- **macOS/Linux:** `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:
```env
GROQ_API_KEY=your_groq_key_here
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=support_docs
```

**Important:** this `.env` file must live inside `backend/`, not the project root — the app looks for it relative to where it runs.

Start the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

**If you hit a "blocked by Application Control policy" error on Windows**, use this instead:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

Confirm the backend is running by visiting `http://localhost:8000/docs` — you should see the interactive API documentation.

---

## 4. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend/` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 5. Try It Out

1. Drag and drop a PDF into the sidebar, or click "browse"
2. Wait a few seconds for it to be processed (chunked, embedded, stored)
3. Once it appears in the document list, ask a question about it in the chat box
4. Watch the answer stream in, grounded entirely in your uploaded document

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `pip` or `uvicorn` command blocked on Windows | Application Control / Smart App Control security policy | Use `python -m pip` / `python -m uvicorn` instead |
| `ImportError: DLL load failed while importing cygrpc` | Windows Smart App Control blocking a compiled dependency | Disable Smart App Control: Settings → Privacy & security → Windows Security → App & browser control |
| Torch/sentence-transformers fails to load on Windows | Missing Visual C++ Redistributable | Install from [aka.ms/vs/17/release/vc_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe), restart your terminal |
| Frontend can't reach backend (CORS or network errors) | Backend not running, or wrong `NEXT_PUBLIC_API_URL` | Confirm backend is running on port 8000, check `.env.local` |
| "Rate limit exceeded" while testing | You've hit the 10 requests/minute limit on `/chat` | Wait a minute, or this is expected behavior — it's intentional |
| Qdrant collection has the wrong vector size | You're running embeddings with a different model than the one used to create the collection | Delete the collection and restart the backend to recreate it — see the Python snippet in `Documentation/command-reference.md` |

---

## What's Running Where

| Service | Port | Purpose |
|---|---|---|
| Next.js frontend | 3000 | The chat UI |
| FastAPI backend | 8000 | API, RAG pipeline |
| Qdrant | 6333 | Vector storage |

All three need to be running simultaneously for the app to work.