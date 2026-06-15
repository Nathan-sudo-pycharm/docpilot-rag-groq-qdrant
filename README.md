# docpilot-rag-groq-qdrant

> A customer support chatbot that actually knows your business — because you train it on your own documents.

---

## What Is This?

Most chatbots give generic answers. This one reads *your* PDFs and answers questions based on what's actually in them.

You upload a document — a product manual, an FAQ, a policy doc — and the system indexes it. From that point on, anyone can ask questions about that document in plain English and get accurate, grounded answers. If the answer isn't in the document, the bot says so instead of making something up.

Think of it as: **a search engine for your documents, with a chat interface on top.**

---

## How Will It Work?

Three steps happen under the hood every time:

**1. Upload**
You drag and drop a PDF. The system splits it into small chunks of text (think: paragraph-sized pieces), converts each chunk into a mathematical representation of its *meaning* (called a vector embedding), and stores everything in a vector database.

**2. Search**
When a user asks a question, the system converts that question into the same kind of mathematical representation and finds the chunks of your document that are closest in meaning — not by keyword matching, but by semantic similarity.

**3. Answer**
Those relevant chunks get passed to an AI language model along with the question. The model reads the chunks and generates a direct answer. The answer streams back word by word, so it feels instant.

---

## Tech I'm Planning to Use

| Layer | Tool | Why |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript | Modern React framework, strong hiring signal for EU startups |
| **Backend** | FastAPI (Python) | Async-native, perfect for streaming AI responses |
| **Vector Database** | Qdrant | Open-source, self-hostable, no paid tier needed |
| **AI / LLM** | Groq + Llama 3.1 | Free tier, fast inference, open model |
| **Embeddings** | nomic-embed-text via Groq | Free, 768-dimensional, good quality |
| **Containerisation** | Docker + docker-compose | One command to run everything locally |
| **Deployment** | Railway | Free tier, supports Docker, gives a live URL |

---

## Planned Features

- [ ] PDF upload with drag-and-drop
- [ ] Automatic document chunking and indexing
- [ ] Semantic search across uploaded documents
- [ ] Streaming chat interface (answers appear word by word)
- [ ] Answers grounded strictly in uploaded documents — no hallucination
- [ ] "I don't know" responses when the answer isn't in the docs
- [ ] Support for multiple document uploads
- [ ] Live deployment with a public URL

---

## What This Is Not (Yet)

- Not a multi-user system with auth (single knowledge base for now)
- Not real-time document updates (re-upload to refresh)
- Not fine-tuned on any domain — it's general purpose RAG

---

## Status

**Planning phase.** Build starts soon.
