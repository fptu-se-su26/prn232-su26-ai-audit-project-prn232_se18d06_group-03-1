import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import MODEL_PATH, TRAINING_DATA_PATH
from app.services.trained_model import train_model


if __name__ == "__main__":
    model = train_model()
    print(f"Trained model saved to: {MODEL_PATH}")
    print(f"Training data: {TRAINING_DATA_PATH}")
    print(f"Intercept: {model.intercept:.6f}")
    print("Weights:")
    for feature, weight in model.weights.items():
        print(f"  {feature}: {weight:.6f}")
