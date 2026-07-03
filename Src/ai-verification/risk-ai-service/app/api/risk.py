from fastapi import APIRouter

from app.schemas.risk import PredictionLogEntry, RiskPredictionRequest, RiskPredictionResponse
from app.services.log_store import read_prediction_logs, write_prediction_log
from app.services.risk_engine import predict_booking_risk


router = APIRouter(tags=["Risk Prediction"])


@router.post("/predict-risk", response_model=RiskPredictionResponse)
def predict_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    result = predict_booking_risk(request)
    write_prediction_log(request, result)
    return result


@router.get("/prediction-logs", response_model=list[PredictionLogEntry])
def prediction_logs() -> list[PredictionLogEntry]:
    return read_prediction_logs()

