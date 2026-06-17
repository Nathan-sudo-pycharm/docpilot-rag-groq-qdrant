from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.core.config import settings

# _client starts as None. The first call to get_qdrant() creates the
# connection. Every call after that reuses the same one.
#
# Why a singleton? QdrantClient holds an HTTP connection pool internally.
# Creating a new client per request wastes memory and time.
# One shared client across the whole app is the correct pattern.
_client: QdrantClient | None = None

def get_qdrant() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url)
    return _client

def ensure_collection(vector_size: int = 768):
    """
    Creates the Qdrant collection if it doesn't already exist.
    Called once at startup so every route can assume the collection is ready.
    
    vector_size=768 matches nomic-embed-text-v1.5's output dimensions.
    Every embedding model produces a fixed-size vector — the collection's
    vector_size must match the model you're using, or searches will fail
    with a dimension mismatch error.
    """
    client = get_qdrant()
    existing = [c.name for c in client.get_collections().collections]

    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
                # COSINE measures the angle between two vectors.
                # Similar texts point in similar directions regardless
                # of length — this is the standard distance metric
                # for text embeddings.
            ),
        )
        print(f"✅ Created Qdrant collection: {settings.qdrant_collection}")
    else:
        print(f"✅ Collection '{settings.qdrant_collection}' already exists")