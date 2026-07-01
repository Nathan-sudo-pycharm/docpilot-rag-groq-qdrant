import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_documents_returns_list():
    # GET /ingest should always return a list, even if empty.
    response = client.get("/ingest")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_upload_invalid_file_type():
    # POST /ingest with a .txt file instead of a PDF should be
    # rejected. We're checking that the backend validates file type
    # and returns 400 (Bad Request), not 200.
    fake_txt = io.BytesIO(b"this is not a pdf")
    response = client.post(
        "/ingest",
        files={"file": ("test.txt", fake_txt, "text/plain")},
    )
    assert response.status_code == 400


def test_delete_nonexistent_document():
    # DELETE /ingest/{filename} for a file that doesn't exist
    # should return 404 (Not Found), not crash with a 500.
    response = client.delete("/ingest/doesnotexist.pdf")
    assert response.status_code == 404