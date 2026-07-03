from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"
PREDICTION_LOG_PATH = DATA_DIR / "ml_prediction_logs.jsonl"
TRAINING_DATA_PATH = DATA_DIR / "training_samples.csv"
MODEL_PATH = DATA_DIR / "risk_model.json"
MODEL_VERSION = "hybrid-logreg-risk-v1"
