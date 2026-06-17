from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_internal_api_key_required() -> None:
    response = client.post(
        "/image/quality-check",
        json={"imageUrl": "https://example.com/test.jpg", "purpose": "DriverLicense"},
    )
    assert response.status_code == 401

