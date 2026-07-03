from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_cancel_count_above_two_is_high_risk() -> None:
    response = client.post(
        "/predict-risk",
        json={
            "bookingId": 32,
            "trust_score": 85,
            "cancel_count": 3,
            "duration": 2,
            "vehicle_value": 300000000,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "High"
    assert data["suggested_action"] == "Nen tu choi"
    assert data["probability"] >= 0.7


def test_trust_score_below_thirty_is_high_risk() -> None:
    response = client.post(
        "/predict-risk",
        json={
            "bookingId": 33,
            "trust_score": 29,
            "cancel_count": 0,
            "duration": 1,
            "vehicle_value": 200000000,
        },
    )

    assert response.status_code == 200
    assert response.json()["risk_level"] == "High"


def test_good_booking_is_low_risk() -> None:
    response = client.post(
        "/predict-risk",
        json={
            "bookingId": 34,
            "trust_score": 95,
            "cancel_count": 0,
            "duration": 2,
            "vehicle_value": 250000000,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "Low"
    assert data["suggested_action"] == "Nen duyet"


def test_prediction_uses_trained_model_version() -> None:
    response = client.post(
        "/predict-risk",
        json={
            "bookingId": 35,
            "trust_score": 58,
            "cancel_count": 2,
            "duration": 14,
            "vehicle_value": 1200000000,
        },
    )

    assert response.status_code == 200
    assert response.json()["modelVersion"] == "hybrid-logreg-risk-v1"


def test_prediction_returns_rag_explanation_and_policy_context() -> None:
    response = client.post(
        "/predict-risk",
        json={
            "bookingId": 36,
            "trust_score": 58,
            "cancel_count": 2,
            "duration": 14,
            "vehicle_value": 1200000000,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "được phân loại rủi ro" in data["explanation"]
    assert len(data["retrieved_context"]) > 0
    assert data["retrieved_context"][0]["source"].endswith(".md")
    assert data["retrieved_context"][0]["content"]


def test_prediction_returns_business_decision_and_dynamic_deposit() -> None:
    response = client.post(
        "/predict-risk",
        json={
            "bookingId": 37,
            "trust_score": 58,
            "cancel_count": 2,
            "duration": 14,
            "vehicle_value": 1200000000,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["operational_decision"] in ["autoApprove", "manualReview", "reject"]
    assert data["deposit_recommendation"]["currency"] == "VND"
    assert data["deposit_recommendation"]["amount"] > 0
