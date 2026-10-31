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
