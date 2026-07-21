import os
import sqlite3
import pytest
from fastapi.testclient import TestClient
import main

# Override DB path for tests
main.DB_PATH = os.path.join(main.DATA_DIR, "test_messages.db")

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def setup_and_cleanup():
    main.init_db()
    yield
    if os.path.exists(main.DB_PATH):
        try:
            os.remove(main.DB_PATH)
        except Exception:
            pass


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint():
    for path in ["/", "/api"]:
        response = client.get(path)
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "Interactive Terminal Web API"


def test_create_message():
    payload = {
        "name": "Test Visitor",
        "content": "Hello via automated test!",
        "timestamp": "2026-07-21T10:37:00Z",
    }
    response = client.post("/api/messages", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "SUCCESS"

    # Verify directly inside DB
    conn = sqlite3.connect(main.DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, content FROM messages WHERE name = ?", ("Test Visitor",))
    row = cursor.fetchone()
    conn.close()
    assert row is not None
    assert row[0] == "Test Visitor"
    assert row[1] == "Hello via automated test!"


def test_api_stats():
    # Call /api/stats and check keys
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_messages" in data
    assert "cache_status" in data
    assert data["cache_status"] == "active"
    assert "uptime_seconds" in data
    initial_total = data["total_messages"]

    # Post a message to invalidate/update stats cache
    payload = {
        "name": "Stats Tester",
        "content": "Checking stats update",
    }
    client.post("/api/messages", json=payload)

    # Next call to /api/stats should reflect +1 total_messages
    response2 = client.get("/api/stats")
    assert response2.status_code == 200
    assert response2.json()["total_messages"] == initial_total + 1

