from sentence_transformers import SentenceTransformer

# This model downloads automatically the first time it's used
# (cached locally afterward, so subsequent runs are instant).
# all-MiniLM-L6-v2 outputs 384-dimensional vectors — fast and
# genuinely good quality for semantic search.
#
# We load it once at import time, not per-request — loading the
# model is the expensive part, running it on text is fast.
_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Takes a list of text strings.
    Returns a list of vectors — one vector per text.

    Each vector has 384 numbers (this model's embedding dimension).

    encode() handles batching internally — passing a list of texts
    is more efficient than calling it once per text.
    """
    embeddings = _model.encode(texts)

    # embeddings comes back as a numpy array. Qdrant expects plain
    # Python lists, so we convert each row with .tolist()
    return [embedding.tolist() for embedding in embeddings]