from fastapi import APIRouter, UploadFile, File, HTTPException
from qdrant_client.models import PointStruct
from app.core.qdrant import get_qdrant
from app.core.config import settings
from app.services.chunker import load_and_chunk
from app.services.embedder import embed_texts
import uuid
from qdrant_client.models import Filter, FieldCondition, MatchValue

# APIRouter is like a mini FastAPI app — it holds routes that get
# registered onto the main app. Splitting routes into files like this
# keeps main.py clean as the project grows.
router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("")
async def ingest_document(file: UploadFile = File(...)):
    """
    Accepts a PDF upload, processes it end-to-end:
    PDF bytes → chunks → vectors → Qdrant
    """

    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()   # read the uploaded bytes
    chunks = load_and_chunk(content, file.filename)

    if not chunks:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    # Extract just the text strings for batch embedding
    texts = [c["text"] for c in chunks]
    vectors = embed_texts(texts)

    # Build Qdrant points. Each point = one chunk + its vector.
    points = [
        PointStruct(
            id=str(uuid.uuid4()),   # unique ID — uuid4 is random, collision-proof
            vector=vector,           # the 384-number embedding
            payload={
                "text": chunk["text"],       # original text (needed at query time)
                **chunk["metadata"],          # source filename, page number
            },
        )
        for chunk, vector in zip(chunks, vectors)
    ]

    # upsert = insert OR update. Re-uploading the same PDF won't
    # create duplicates — points with the same ID just get replaced.
    get_qdrant().upsert(
        collection_name=settings.qdrant_collection,
        points=points,
    )

    return {
        "ingested_chunks": len(points),
        "filename": file.filename,
    }



@router.delete("/{filename}")
async def delete_document(filename: str):
    """
    Deletes all chunks belonging to a specific document from Qdrant.

    We stored the original filename on every chunk's payload under
    the "source" key back in Day 3's chunker.py. This lets us delete
    by filtering on that field, rather than needing to track
    individual point IDs ourselves.
    """
    get_qdrant().delete(
        collection_name=settings.qdrant_collection,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="source",
                    match=MatchValue(value=filename),
                )
            ]
        ),
    )

    return {"deleted": filename}