from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to" in response.json()["message"]

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_suggest_price_regular_day_no_increase():
    response = client.post("/suggest-price", json={
        "vehicle_type": "Car",
        "date": "2026-07-13",
        "vacant_rate": 0.5,
        "base_price": 1000000
    })

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] == 1000000
    assert data["formatted_suggested_price"] == "1,000,000 \u0111"
    assert data["multiplier"] == 1.0
    assert data["applied_rules"] == []
    assert data["is_weekend"] is False
    assert data["is_holiday"] is False
    assert data["is_low_vacancy"] is False

def test_suggest_price_weekend_increases_ten_percent():
    response = client.post("/suggest-price", json={
        "vehicle_type": "Car",
        "date": "2026-07-18",
        "vacant_rate": 0.5,
        "base_price": 1000000
    })

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] == 1100000
    assert data["multiplier"] == 1.1
    assert data["applied_rules"] == ["weekend_10_percent"]
    assert data["is_weekend"] is True

def test_suggest_price_holiday_increases_thirty_percent():
    response = client.post("/suggest-price", json={
        "vehicle_type": "Motorbike",
        "date": "2026-09-02",
        "vacant_rate": 0.5,
        "base_price": 1000000
    })

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] == 1300000
    assert data["multiplier"] == 1.3
    assert data["applied_rules"] == ["vietnam_holiday_30_percent"]
    assert data["is_holiday"] is True

def test_suggest_price_low_vacancy_increases_ten_percent():
    response = client.post("/suggest-price", json={
        "vehicle_type": "Car",
        "date": "2026-07-13",
        "vacant_rate": 0.19,
        "base_price": 1000000
    })

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] == 1100000
    assert data["multiplier"] == 1.1
    assert data["applied_rules"] == ["low_vacancy_10_percent"]
    assert data["is_low_vacancy"] is True

def test_suggest_price_combines_all_matching_rules():
    response = client.post("/suggest-price", json={
        "vehicle_type": "Car",
        "date": "2026-04-26",
        "vacant_rate": 0.1,
        "base_price": 1000000
    })

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] == 1500000
    assert data["multiplier"] == 1.5
    assert data["applied_rules"] == [
        "weekend_10_percent",
        "vietnam_holiday_30_percent",
        "low_vacancy_10_percent"
    ]
    assert data["is_weekend"] is True
    assert data["is_holiday"] is True
    assert data["is_low_vacancy"] is True

def test_suggest_price_validates_request():
    invalid_payloads = [
        {
            "vehicle_type": "Car",
            "date": "2026-07-13",
            "vacant_rate": 0.5,
            "base_price": 0
        },
        {
            "vehicle_type": "Car",
            "date": "2026-07-13",
            "vacant_rate": 1.1,
            "base_price": 1000000
        },
        {
            "vehicle_type": "Car",
            "date": "13-07-2026",
            "vacant_rate": 0.5,
            "base_price": 1000000
        },
        {
            "vehicle_type": "Truck",
            "date": "2026-07-13",
            "vacant_rate": 0.5,
            "base_price": 1000000
        },
    ]

    for payload in invalid_payloads:
        response = client.post("/suggest-price", json=payload)
        assert response.status_code == 422
