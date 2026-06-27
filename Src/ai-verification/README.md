# MoveVN AI Verification Service

Internal FastAPI service for OCR, image quality, and face matching.

## APIs

```text
GET  /health
POST /image/quality-check
POST /verify/driver-license
POST /verify/vehicle-registration
POST /face/enroll
POST /face/match-document
```

All non-health endpoints require:

```text
X-API-Key: dev-ai-verification-key
```

Example vehicle registration request:

```json
{
  "expectedVehicleType": "Motorbike",
  "expectedLicensePlate": "59X1-12345",
  "expectedBrand": "Honda",
  "expectedModel": "Air Blade 125",
  "fileUrl": "https://..."
}
```

`expectedLicensePlate`, `expectedBrand`, and `expectedModel` are optional. Model matching is base-name tolerant, so an OCR result like
`Air Blade` can match catalog model names such as `Air Blade 125`, `Air Blade 150`, or `Air Blade 160`.

## Run

```powershell
cd Src/ai-verification
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

## Test Images

Put local images into:

```text
sample_images/
  driver_license/
  vehicle_registration/
  face/
```

For local manual testing you can pass a file path in `imageUrl`, `frontImageUrl`, or `fileUrl`.
In backend integration, pass Cloudinary/private signed URLs.

## OCR Scope

- Driver license OCR with PaddleOCR PP-OCRv6.
- Driver license classification: `Motorbike` vs `Car`.
- License class verification.
- Vehicle registration OCR for motorbike/car registration only.
- No OCR for inspection or insurance documents in this phase.

## Face Scope

The API contract is ready for:

- Selfie vs CCCD face enrollment.
- Enrolled selfie vs document face matching.

The current implementation has an OpenCV fallback so endpoints are runnable early. Replace the fallback in
`app/services/face_service.py` with InsightFace SCRFD + ArcFace for production accuracy.
