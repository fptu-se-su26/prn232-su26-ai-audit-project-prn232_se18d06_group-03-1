from datetime import datetime
from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="MoveVN ML Service", version="1.0.0")


class RiskPredictionRequest(BaseModel):
    bookingId: int
    userId: int
    trustScore: float | None = None
    cancelCount: int
    durationDays: int
    vehicleValue: float


class RiskPredictionResponse(BaseModel):
    bookingId: int
    riskScore: float
    riskLevel: str
    probability: float
    modelVersion: str = "rule-based-v1"
    topRiskFactors: list[str]
    createdAt: datetime


class PricingSuggestionRequest(BaseModel):
    vehicleId: int
    basePricePerDay: float
    startDate: str
    endDate: str


class PricingSuggestionResponse(BaseModel):
    suggestedPricePerDay: float
    explanation: str


@app.post("/predict-risk", response_model=RiskPredictionResponse)
def predict_risk(payload: RiskPredictionRequest) -> RiskPredictionResponse:
    score = 25.0
    factors: list[str] = []

    if (payload.trustScore or 100) < 30:
        score += 45
        factors.append("Low trust score")
    if payload.cancelCount > 2:
        score += 35
        factors.append("Frequent cancellations")
    if payload.durationDays >= 7:
        score += 10
        factors.append("Long booking duration")
    if payload.vehicleValue >= 5_000_000:
        score += 10
        factors.append("High vehicle value")

    score = max(0, min(score, 100))
    level = "High" if score >= 70 else "Medium" if score >= 40 else "Low"

    return RiskPredictionResponse(
        bookingId=payload.bookingId,
        riskScore=score,
        riskLevel=level,
        probability=round(score / 100, 2),
        topRiskFactors=factors,
        createdAt=datetime.utcnow(),
    )


@app.post("/suggest-price", response_model=PricingSuggestionResponse)
def suggest_price(payload: PricingSuggestionRequest) -> PricingSuggestionResponse:
    suggested = payload.basePricePerDay
    explanation = "Base price retained."

    start_dt = datetime.fromisoformat(payload.startDate)
    if start_dt.weekday() >= 5:
        suggested *= 1.2
        explanation = "Weekend uplift applied."

    return PricingSuggestionResponse(
        suggestedPricePerDay=round(suggested, 0),
        explanation=explanation,
    )
