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
    client = get_qdrant()
    
    # Check if any chunks exist for this filename before deleting.
    # count() with a filter returns how many points match.
    result = client.count(
        collection_name=settings.qdrant_collection,
        count_filter=Filter(
            must=[
                FieldCondition(
                    key="source",
                    match=MatchValue(value=filename),
                )
            ]
        ),
    )

    if result.count == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Document '{filename}' not found"
        )

    client.delete(
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

@router.get("")
async def list_documents():
    """
    Returns a list of unique documents currently stored in Qdrant,
    grouped by filename, with their chunk counts.

    Qdrant doesn't have a native "list distinct values" query, so we
    scroll through all points and aggregate them in Python. This is
    fine at small scale (hundreds/thousands of chunks) but would need
    a different approach at much larger scale.
    """
    client = get_qdrant()

    # scroll() retrieves points in batches. We only need the payload
    # (not the actual vectors) since we're just counting by filename.
    documents: dict[str, int] = {}
    offset = None

    while True:
        records, offset = client.scroll(
            collection_name=settings.qdrant_collection,
            with_payload=["source"],
            with_vectors=False,
            limit=100,
            offset=offset,
        )

        for record in records:
            source = record.payload.get("source", "unknown")
            documents[source] = documents.get(source, 0) + 1

        if offset is None:
            break

    return [
        {"filename": filename, "chunk_count": count}
        for filename, count in documents.items()
    ]