# MoveVN AI Verification Service

Internal FastAPI service for OCR, image quality, and face matching.

## APIs

```text
GET  /health
POST /image/quality-check
POST /verify/national-id
POST /verify/national-id-file
POST /verify/driver-license
POST /verify/vehicle-registration
POST /verify/driver-license-yolo-vietocr
POST /verify/vehicle-registration-yolo-vietocr
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

Example national ID front request:

```json
{
  "fullname": "Nguyen Nam Thang",
  "frontImageUrl": "sample_images/cccd/cccd.png"
}
```

Optional YOLOv5 + VietOCR endpoints use the same request and response schemas as the main verification endpoints:

```text
POST /verify/driver-license-yolo-vietocr
POST /verify/vehicle-registration-yolo-vietocr
```

Enable them only after placing trained YOLOv5 field-detection weights on the service machine:

```env
YOLO_VIETOCR_ENABLED=true
YOLO_VIETOCR_YOLOV5_REPO=ultralytics/yolov5
YOLO_VIETOCR_DRIVER_LICENSE_WEIGHTS=models/gplx_yolov5.pt
YOLO_VIETOCR_VEHICLE_REGISTRATION_WEIGHTS=models/cavet_yolov5.pt
YOLO_VIETOCR_CONFIDENCE_THRESHOLD=0.35
```

Suggested YOLO labels:

```text
Driver license: full_name, license_number, date_of_birth, license_class, issue_date, expiry_date
Vehicle registration: license_plate, owner_name, brand, model, engine_number, chassis_number, vehicle_type
```

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
- Optional driver license field OCR with YOLOv5 + VietOCR.
- National ID front OCR for basic CCCD fields.
- Driver license classification: `Motorbike` vs `Car`.
- License class verification.
- Vehicle registration OCR for motorbike/car registration only.
- Optional vehicle registration field OCR with YOLOv5 + VietOCR.
- No OCR for inspection or insurance documents in this phase.

## Face Scope

The API contract is ready for:

- Selfie vs CCCD face enrollment.
- Enrolled selfie vs document face matching.

The current implementation has an OpenCV fallback so endpoints are runnable early. Replace the fallback in
`app/services/face_service.py` with InsightFace SCRFD + ArcFace for production accuracy.
