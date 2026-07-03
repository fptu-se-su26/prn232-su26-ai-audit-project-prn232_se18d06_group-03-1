import json
from datetime import UTC, datetime
from typing import Any

from app.core.config import PREDICTION_LOG_PATH
from app.schemas.risk import PredictionLogEntry, RiskPredictionRequest, RiskPredictionResponse


def write_prediction_log(
    request: RiskPredictionRequest,
    result: RiskPredictionResponse,
) -> None:
    PREDICTION_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "bookingId": request.booking_id,
        "input": request.model_dump(by_alias=True),
        "result": result.model_dump(by_alias=True),
        "createdAt": datetime.now(UTC).isoformat(),
    }

    with PREDICTION_LOG_PATH.open("a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(entry, ensure_ascii=True) + "\n")


def read_prediction_logs() -> list[PredictionLogEntry]:
    if not PREDICTION_LOG_PATH.exists():
        return []

    entries: list[PredictionLogEntry] = []
    with PREDICTION_LOG_PATH.open("r", encoding="utf-8") as log_file:
        for line in log_file:
            payload: dict[str, Any] = json.loads(line)
            entries.append(PredictionLogEntry(**payload))

    return entries

