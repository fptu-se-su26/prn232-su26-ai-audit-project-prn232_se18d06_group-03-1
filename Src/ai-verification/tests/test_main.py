from fastapi.testclient import TestClient
from pathlib import Path

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


def test_yolo_vietocr_endpoint_is_optional_when_disabled() -> None:
    image_path = Path("sample_images/driver_license/gplx.jpg").resolve()

    response = client.post(
        "/verify/driver-license-yolo-vietocr",
        headers={"X-API-Key": "dev-ai-verification-key"},
        json={"frontImageUrl": str(image_path)},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["recommendation"] == "ManualReview"
    assert "YOLO_VIETOCR_UNAVAILABLE" in payload["flags"]

