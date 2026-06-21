from groq import Groq
from app.core.qdrant import get_qdrant
from app.core.config import settings
from app.services.embedder import embed_texts
from typing import Generator

_groq = Groq(api_key=settings.groq_api_key)

# This prompt is critical. It tells the LLM:
# 1. Its role (support agent)
# 2. The rule (only answer from the context provided)
# 3. What to do when it doesn't know
# Without rule 2, the LLM will mix in its training data and hallucinate.
SYSTEM_PROMPT = """You are a helpful customer support agent.
Answer ONLY based on the context provided below.
If the answer is not in the context, say: "I don't have information about that in the provided documents."
Be concise, friendly, and accurate."""


def retrieve_context(question: str, top_k: int = 5) -> list[str]:
    """
    Converts the question to a vector using the SAME local embedder
    from Day 3, searches Qdrant for the nearest chunks.

    top_k=5 is a good default — enough context without overwhelming
    the LLM with irrelevant chunks.
    """
    [q_vector] = embed_texts([question])

    # query_points() is the modern qdrant-client API (replaces the
    # older, now-deprecated .search() method). It returns a response
    # object with a `.points` list instead of a bare list of hits.
    response = get_qdrant().query_points(
        collection_name=settings.qdrant_collection,
        query=q_vector,
        limit=top_k,
        with_payload=True,
    )

    return [point.payload["text"] for point in response.points]


def stream_answer(question: str) -> Generator[str, None, None]:
    """
    Full RAG pipeline — retrieve context then stream the LLM response.

    Generator[str, None, None] means this function yields strings one
    at a time instead of returning them all at once. This is what makes
    streaming work — we yield each token as Groq sends it to us.
    """
    context_chunks = retrieve_context(question)

    # Join chunks with a separator so the LLM sees them as distinct passages
    context = "\n\n---\n\n".join(context_chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}"
        },
    ]

    # stream=True tells Groq to send tokens as they're generated,
    # not wait until the full response is ready.
    stream = _groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:    # some chunks arrive empty — skip them
            yield token