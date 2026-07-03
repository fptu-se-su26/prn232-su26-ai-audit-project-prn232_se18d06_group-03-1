from app.core.config import MODEL_VERSION
from app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse
from app.services.rag_retriever import build_rag_explanation, retrieve_risk_context
from app.services.trained_model import load_model


def predict_booking_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    model = load_model()
    score, factors = _calculate_risk_score(request, model_probability=model.predict_probability(request) if model else None)
    risk_level = _risk_level(score)
    suggested_action = _suggested_action(risk_level)
    operational_decision = _operational_decision(risk_level)
    deposit_recommendation = _deposit_recommendation(request, risk_level)
    retrieved_context = retrieve_risk_context(request, risk_level, factors)
    explanation = build_rag_explanation(request, risk_level, score, suggested_action, factors, retrieved_context)

    return RiskPredictionResponse(
        bookingId=request.booking_id,
        risk_level=risk_level,
        probability=round(score / 100, 2),
        risk_score=score,
        suggested_action=suggested_action,
        operational_decision=operational_decision,
        deposit_recommendation=deposit_recommendation,
        top_risk_factors=factors,
        explanation=explanation,
        retrieved_context=retrieved_context,
        modelVersion=model.version if model else MODEL_VERSION,
    )


def _calculate_risk_score(request: RiskPredictionRequest, model_probability: float | None = None) -> tuple[int, list[str]]:
    score = 10.0
    factors: list[str] = []

    if request.cancel_count > 2:
        factors.append("cancel_count > 2")
        score = max(score, 85)

    if request.trust_score < 30:
        factors.append("trust_score < 30")
        score = max(score, 90)

    if model_probability is None:
        trust_penalty = (100 - request.trust_score) * 0.35
        cancel_penalty = min(request.cancel_count * 12, 30)
        duration_penalty = _duration_penalty(request.duration)
        value_penalty = _vehicle_value_penalty(request.vehicle_value)

        score = max(score, 10 + trust_penalty + cancel_penalty + duration_penalty + value_penalty)
    else:
        score = max(score, model_probability * 100)

    if request.trust_score < 60 and "trust_score < 30" not in factors:
        factors.append("trust_score below normal")
    if request.cancel_count > 0 and "cancel_count > 2" not in factors:
        factors.append("has previous cancellations")
    if request.duration >= 14:
        factors.append("long rental duration")
    if request.vehicle_value >= 1_000_000_000:
        factors.append("high vehicle value")

    if not factors:
        factors.append("stable booking profile")

    return min(round(score), 100), factors


def _duration_penalty(duration: float) -> float:
    if duration >= 30:
        return 15
    if duration >= 14:
        return 10
    if duration >= 7:
        return 5
    return 0


def _vehicle_value_penalty(vehicle_value: float) -> float:
    if vehicle_value >= 1_500_000_000:
        return 15
    if vehicle_value >= 1_000_000_000:
        return 10
    if vehicle_value >= 500_000_000:
        return 5
    return 0


def _risk_level(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def _suggested_action(risk_level: str) -> str:
    if risk_level == "High":
        return "Nen tu choi"
    if risk_level == "Medium":
        return "Can nhac"
    return "Nen duyet"


def _operational_decision(risk_level: str) -> str:
    if risk_level == "High":
        return "reject"
    if risk_level == "Medium":
        return "manualReview"
    return "autoApprove"


def _deposit_recommendation(request: RiskPredictionRequest, risk_level: str) -> dict[str, float | int | str]:
    amount = {
        "Low": 1_000_000,
        "Medium": 2_500_000,
        "High": 4_000_000,
    }[risk_level]

    reasons = [f"mức rủi ro {risk_level}"]
    if request.duration >= 14:
        amount += 500_000
        reasons.append("thời gian thuê dài")
    if request.vehicle_value >= 1_000_000_000:
        amount += 1_000_000
        reasons.append("giá trị xe cao")

    amount = min(amount, 6_000_000)
    rounded_amount = int(round(amount / 100_000) * 100_000)

    return {
        "currency": "VND",
        "rate": round(rounded_amount / request.vehicle_value, 4) if request.vehicle_value > 0 else 0,
        "amount": rounded_amount,
        "reason": "Cọc vận hành để xử lý va quẹt, phụ phí và phát sinh nhỏ; đã có CCCD/hợp đồng nên không neo theo toàn bộ giá trị xe. Yếu tố xét: " + ", ".join(reasons) + ".",
    }
