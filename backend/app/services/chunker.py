from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import tempfile
import os

def load_and_chunk(file_bytes: bytes, filename: str) -> list[dict]:
    """
    Takes raw PDF bytes, returns a list of text chunks with metadata.

    Each chunk looks like:
    {
        "text": "Our refund policy allows returns within 30 days...",
        "metadata": {"source": "faq.pdf", "page": 2}
    }
    """

    # PyPDFLoader needs a real file path, not bytes.
    # tempfile creates a temporary file, we write to it, then delete it after.
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()  # returns one Document per page

        # RecursiveCharacterTextSplitter tries to split on natural boundaries:
        # 1. First it tries \n\n (paragraph breaks)
        # 2. If still too big, tries \n (line breaks)
        # 3. Then . (sentence ends)
        # 4. Finally just cuts at chunk_size characters
        #
        # chunk_size=500 means each chunk is at most 500 characters.
        # chunk_overlap=50 means the last 50 characters of chunk N
        # are also the first 50 characters of chunk N+1 — this prevents
        # answers from being split awkwardly across chunk boundaries.
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "],
        )
        chunks = splitter.split_documents(docs)

        return [
            {
                "text": chunk.page_content,
                "metadata": {
                    **chunk.metadata,        # page number from PyPDF
                    "source": filename,      # original filename
                },
            }
            for chunk in chunks
            if chunk.page_content.strip()   # skip empty chunks
        ]
    finally:
        os.unlink(tmp_path)   # always delete the temp file