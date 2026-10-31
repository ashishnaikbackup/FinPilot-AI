from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_data_status_is_honest_about_market_quotes():
    response = client.get("/api/data/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["market_quotes"]["status"] == "not_connected"
    assert payload["india_macro"]["status"] == "public_api"


def test_dbie_search_requires_query():
    response = client.get("/api/data/india/dbie/search?q=x")
    assert response.status_code == 422


def test_world_bank_rejects_invalid_country_code():
    response = client.get("/api/data/global/world-bank?country=I%2F")
    assert response.status_code == 422



def test_local_mentor_status_is_explicit_about_provider():
    response = client.get("/api/mentor/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "Ollama (local device)"
    assert payload["status"] in {"ready", "model_missing", "offline"}


def test_local_mentor_requires_user_message_last():
    response = client.post("/api/mentor/chat", json={
        "messages": [{"role": "assistant", "content": "A prior answer"}]
    })
    assert response.status_code == 422


def test_local_mentor_rejects_empty_chat():
    response = client.post("/api/mentor/chat", json={"messages": []})
    assert response.status_code == 422


def test_pages_origin_is_allowed_for_local_api():
    response = client.options(
        "/api/mentor/chat",
        headers={
            "Origin": "https://ashishnaikbackup.github.io",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://ashishnaikbackup.github.io"
