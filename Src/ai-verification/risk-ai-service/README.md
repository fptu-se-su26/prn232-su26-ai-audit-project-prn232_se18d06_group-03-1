# MoveVN Booking Risk AI Service

Standalone FastAPI service for trained booking risk scoring and RAG-based policy explanation.

This service is intentionally separated from the existing OCR/verification service.

## APIs

```text
GET  /health
POST /predict-risk
GET  /prediction-logs
```

## ML + RAG Pipeline

1. Receive booking features: `trust_score`, `cancel_count`, `duration`, `vehicle_value`.
2. Load trained logistic regression model from `data/risk_model.json`.
3. Apply hard safety rules:
   - `cancel_count > 2` -> `High`
   - `trust_score < 30` -> `High`
4. Retrieve related policy sections from `knowledge_base/*.md` using TF-IDF cosine retrieval.
5. Return score, action, top factors, RAG explanation, retrieved policy context, and write prediction log.

If `data/risk_model.json` is missing, the service falls back to the rule score.

## Train

The sample dataset is in `data/training_samples.csv`.

```powershell
cd src/ai-verification/risk-ai-service
.\.venv\Scripts\Activate.ps1
python scripts/train_model.py
```

Training writes `data/risk_model.json`, which `/predict-risk` loads at runtime.

## RAG Knowledge Base

Policy files are stored in:

```text
knowledge_base/
  booking_risk_policy.md
  cancellation_and_trust_policy.md
  staff_action_policy.md
```

Update these files when business rules change. `/predict-risk` retrieves relevant sections and returns them in `retrieved_context`.

## Response

`/predict-risk` returns:

- `risk_level`: `Low`, `Medium`, or `High`
- `probability`: 0.0 - 1.0
- `risk_score`: 0 - 100
- `suggested_action`: `Nen duyet`, `Can nhac`, or `Nen tu choi`
- `operational_decision`: `autoApprove`, `manualReview`, or `reject`
- `deposit_recommendation`: dynamic deposit rate and VND amount
- `explanation`: Vietnamese RAG explanation
- `retrieved_context`: policy snippets used for explanation

## Business Touchpoints

- Staff/Admin can use `operational_decision` to auto-approve low-risk bookings or route medium-risk bookings to manual review.
- Owners can use `risk_score`, `suggested_action`, and `deposit_recommendation` when deciding whether to accept a rental request.
- Dynamic deposit protects high-value vehicles and long rentals by increasing deposit percentage based on risk signals.

Each prediction is appended to `data/ml_prediction_logs.jsonl` with:

- `bookingId`
- `input`
- `result`
- `createdAt`

## Run

```powershell
cd src/ai-verification/risk-ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

## Example

```powershell
curl -X POST http://127.0.0.1:8010/predict-risk `
  -H "Content-Type: application/json" `
  -d "{\"bookingId\":101,\"trust_score\":25,\"cancel_count\":1,\"duration\":3,\"vehicle_value\":800000000}"
```
