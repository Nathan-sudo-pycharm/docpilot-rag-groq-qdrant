from fastapi.testclient import TestClient
from app.main import app

# TestClient wraps your FastAPI app and lets you send HTTP requests
# to it without running a real server. It's like a fake browser
# that talks directly to your app in memory.
client = TestClient(app)


def test_sanity():
    # Basic pytest sanity check — confirms pytest itself is working.
    assert 1 + 1 == 2


def test_health_endpoint():
    # Send a GET request to /health, just like a browser would.
    response = client.get("/health")

    # Check the HTTP status code is 200 (OK).
    assert response.status_code == 200

    # Parse the JSON body the endpoint returned.
    data = response.json()

    # Check the actual values in the response match what we expect.
    assert data["status"] == "ok"
    assert data["service"] == "docpilot-api"