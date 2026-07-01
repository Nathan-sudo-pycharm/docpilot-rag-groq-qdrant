# DocPilot — Day 10: Basic Testing Notes

## What We Did

Added a basic pytest test suite to the backend. Wrote 5 tests across 2 files, caught and fixed a real bug in the process.

**Test files:**
- `backend/tests/test_sanity.py`
- `backend/tests/test_ingest.py`

---

## How pytest Works

pytest is Python's standard testing framework. When you run `pytest` from the `backend/` folder, it:

1. Scans for any file named `test_*.py`
2. Inside those files, finds any function named `test_*`
3. Runs each function
4. If any `assert` inside the function fails, the test is marked as FAILED
5. If no asserts fail, the test is marked as PASSED

The output uses dots for passing tests and `F` for failures. With `-v` (verbose), it prints each test name individually.

```
tests/test_sanity.py::test_sanity          PASSED
tests/test_sanity.py::test_health_endpoint PASSED
```

### What `assert` does

`assert` is the core mechanism. It says: "I am claiming this is True. If it's not, crash and tell me."

```python
assert 1 + 1 == 2        # passes silently
assert response.status_code == 200   # passes if status is 200
assert isinstance(data, list)        # passes if data is a list
```

If an assert fails, pytest shows you exactly what the actual value was vs what you expected:
```
AssertionError: assert 200 == 404
  where 200 = <Response [200 OK]>.status_code
```

---

## How TestClient Works

For FastAPI endpoints, we use `TestClient` — it lets you send HTTP requests to your app **without running a real server**. No uvicorn, no Docker, nothing running. It talks directly to your app in memory.

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_something():
    response = client.get("/some-endpoint")
    assert response.status_code == 200
    assert response.json()["key"] == "value"
```

`response.status_code` — the HTTP status code (200, 400, 404, etc.)
`response.json()` — the JSON body the endpoint returned, parsed into a Python dict or list

---

## The Tests We Wrote

### `backend/tests/test_sanity.py`

#### `test_sanity`
```python
def test_sanity():
    assert 1 + 1 == 2
```
A trivial check that confirms pytest itself is installed and working. If this fails, something is broken with the test setup, not your app.

#### `test_health_endpoint`
```python
def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "docpilot-api"
```
Tests the `GET /health` endpoint defined in `main.py`. Checks both the status code and the actual values in the JSON response. This is the baseline — if this fails, the entire app startup is broken.

---

### `backend/tests/test_ingest.py`

#### `test_list_documents_returns_list`
```python
def test_list_documents_returns_list():
    response = client.get("/ingest")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```
Tests `GET /ingest`. Doesn't check the contents of the list (that would require Qdrant to be running with known data), just that the endpoint returns 200 and the response is always a list — even if empty. This is called a **shape test** — checking the structure of the response, not the values.

#### `test_upload_invalid_file_type`
```python
def test_upload_invalid_file_type():
    fake_txt = io.BytesIO(b"this is not a pdf")
    response = client.post(
        "/ingest",
        files={"file": ("test.txt", fake_txt, "text/plain")},
    )
    assert response.status_code == 400
```
Tests `POST /ingest` with a `.txt` file instead of a PDF. The backend should reject it with `400 Bad Request`. This is an **error handling test** — checking that bad input is rejected cleanly, not passed through or causing a crash.

`io.BytesIO` creates an in-memory fake file — no real file on disk needed.

#### `test_delete_nonexistent_document`
```python
def test_delete_nonexistent_document():
    response = client.delete("/ingest/doesnotexist.pdf")
    assert response.status_code == 404
```
Tests `DELETE /ingest/{filename}` for a file that doesn't exist. Should return `404 Not Found`.

**This test caught a real bug** — the endpoint was returning `200 OK` even when nothing was deleted, because Qdrant's `delete()` with a filter silently succeeds even if zero points matched. The fix was to call `client.count()` first and raise `HTTPException(status_code=404)` if the count was 0.

This is exactly what tests are for: catching behavior that looks fine on the surface but is actually wrong.

---

## The Bug We Found and Fixed

**File:** `backend/app/routes/ingest.py` — `DELETE /{filename}` endpoint

**Bug:** Returned `200 {"deleted": filename}` even when the filename didn't exist in Qdrant.

**Root cause:** Qdrant's `.delete()` with a filter doesn't raise an error if zero points matched — it just does nothing and returns successfully.

**Fix:** Added a `.count()` call before `.delete()` to check if any chunks exist for the filename. If `result.count == 0`, raise `HTTPException(status_code=404)`.

```python
result = client.count(
    collection_name=settings.qdrant_collection,
    count_filter=Filter(
        must=[FieldCondition(key="source", match=MatchValue(value=filename))]
    ),
)

if result.count == 0:
    raise HTTPException(status_code=404, detail=f"Document '{filename}' not found")
```

---

## Running the Tests

From inside `backend/` with the venv activated:

```powershell
pytest          # basic run, dots output
pytest -v       # verbose, shows each test name
pytest -v tests/test_ingest.py   # run one file only
```

Final result: **5 passed, 3 warnings** — the warnings are deprecation notices from third-party packages, not errors.

---

## What These Tests Don't Cover (Yet)

- `POST /ingest` with a real PDF (needs a sample PDF fixture)
- `DELETE /ingest/{filename}` for a file that actually exists (needs Qdrant running)
- The `/chat` endpoint (needs Groq API key and Qdrant running)
- These are called **integration tests** and require the full stack running — a natural next step for v1.1