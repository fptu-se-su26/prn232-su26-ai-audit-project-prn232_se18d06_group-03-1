from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


RiskLevel = Literal["Low", "Medium", "High"]
SuggestedAction = Literal["Nen duyet", "Can nhac", "Nen tu choi"]
OperationalDecision = Literal["autoApprove", "manualReview", "reject"]


class RiskPredictionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    booking_id: int = Field(alias="bookingId", gt=0)
    trust_score: float = Field(ge=0, le=100)
    cancel_count: int = Field(ge=0)
    duration: float = Field(gt=0, description="Rental duration in days.")
    vehicle_value: float = Field(ge=0)


class RiskPredictionResponse(BaseModel):
    booking_id: int = Field(alias="bookingId")
    risk_level: RiskLevel
    probability: float = Field(ge=0, le=1)
    risk_score: int = Field(ge=0, le=100)
    suggested_action: SuggestedAction
    operational_decision: OperationalDecision
    deposit_recommendation: "DepositRecommendation"
    top_risk_factors: list[str]
    explanation: str
    retrieved_context: list["RetrievedContext"]
    model_version: str = Field(alias="modelVersion")


class RetrievedContext(BaseModel):
    source: str
    title: str
    content: str
    relevance: float = Field(ge=0)


class DepositRecommendation(BaseModel):
    currency: str = "VND"
    rate: float = Field(ge=0, le=1)
    amount: int = Field(ge=0)
    reason: str


class PredictionLogEntry(BaseModel):
    booking_id: int = Field(alias="bookingId")
    input: dict[str, Any]
    result: dict[str, Any]
    created_at: datetime = Field(alias="createdAt")
