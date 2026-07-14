from groq import Groq
from app.core.qdrant import get_qdrant
from app.core.config import settings
from app.services.embedder import embed_texts
from typing import Generator
import json

_groq = Groq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are a helpful customer support agent.
Answer ONLY based on the context provided below.
If the answer is not in the context, say: "I don't have information about that in the provided documents."
Be concise, friendly, and accurate."""


def retrieve_context(question: str, top_k: int = 5) -> list[dict]:
    """
    Returns a list of dicts with text + source metadata instead of
    just text strings. We need the metadata (filename, page) for
    citations, so we stop discarding it here.
    """
    [q_vector] = embed_texts([question])

    response = get_qdrant().query_points(
        collection_name=settings.qdrant_collection,
        query=q_vector,
        limit=top_k,
        with_payload=True,
    )

    return [
        {
            "text": point.payload["text"],
            "source": point.payload.get("source", "unknown"),
            "page": point.payload.get("page", None),
        }
        for point in response.points
    ]

def stream_answer(question: str, chunks: list[dict]) -> Generator[str, None, None]:
    context = "\n\n---\n\n".join(c["text"] for c in chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}"
        },
    ]

    stream = _groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token