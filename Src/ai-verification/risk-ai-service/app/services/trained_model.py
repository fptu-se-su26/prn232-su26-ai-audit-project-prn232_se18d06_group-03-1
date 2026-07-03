import csv
import json
import math
from dataclasses import dataclass
from pathlib import Path

from app.core.config import MODEL_PATH, MODEL_VERSION, TRAINING_DATA_PATH
from app.schemas.risk import RiskPredictionRequest


FEATURES = ("trust_score", "cancel_count", "duration", "vehicle_value")
FEATURE_SCALES = {
    "trust_score": 100.0,
    "cancel_count": 5.0,
    "duration": 30.0,
    "vehicle_value": 2_000_000_000.0,
}


@dataclass(frozen=True)
class TrainedRiskModel:
    intercept: float
    weights: dict[str, float]
    version: str

    def predict_probability(self, request: RiskPredictionRequest) -> float:
        z = self.intercept
        for feature in FEATURES:
            z += self.weights[feature] * _feature_value(request, feature)
        return 1 / (1 + math.exp(-z))


def load_model(path: Path = MODEL_PATH) -> TrainedRiskModel | None:
    if not path.exists():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))
    return TrainedRiskModel(
        intercept=float(payload["intercept"]),
        weights={feature: float(payload["weights"][feature]) for feature in FEATURES},
        version=str(payload.get("version", MODEL_VERSION)),
    )


def train_model(
    training_data_path: Path = TRAINING_DATA_PATH,
    output_path: Path = MODEL_PATH,
    learning_rate: float = 0.15,
    epochs: int = 4000,
) -> TrainedRiskModel:
    samples = _read_samples(training_data_path)
    weights = {feature: 0.0 for feature in FEATURES}
    intercept = 0.0

    for _ in range(epochs):
        gradient_weights = {feature: 0.0 for feature in FEATURES}
        gradient_intercept = 0.0

        for features, label in samples:
            z = intercept + sum(weights[feature] * features[feature] for feature in FEATURES)
            prediction = 1 / (1 + math.exp(-z))
            error = prediction - label
            gradient_intercept += error
            for feature in FEATURES:
                gradient_weights[feature] += error * features[feature]

        sample_count = len(samples)
        intercept -= learning_rate * gradient_intercept / sample_count
        for feature in FEATURES:
            weights[feature] -= learning_rate * gradient_weights[feature] / sample_count

    model = TrainedRiskModel(intercept=intercept, weights=weights, version=MODEL_VERSION)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            {
                "version": MODEL_VERSION,
                "features": FEATURES,
                "scales": FEATURE_SCALES,
                "intercept": model.intercept,
                "weights": model.weights,
                "sample_count": len(samples),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return model


def _read_samples(path: Path) -> list[tuple[dict[str, float], int]]:
    samples: list[tuple[dict[str, float], int]] = []
    with path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            features = {
                "trust_score": float(row["trust_score"]) / FEATURE_SCALES["trust_score"],
                "cancel_count": float(row["cancel_count"]) / FEATURE_SCALES["cancel_count"],
                "duration": float(row["duration"]) / FEATURE_SCALES["duration"],
                "vehicle_value": float(row["vehicle_value"]) / FEATURE_SCALES["vehicle_value"],
            }
            samples.append((features, int(row["label"])))
    return samples


def _feature_value(request: RiskPredictionRequest, feature: str) -> float:
    return float(getattr(request, feature)) / FEATURE_SCALES[feature]
