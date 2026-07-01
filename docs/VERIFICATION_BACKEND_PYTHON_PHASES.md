# MoveVN Verification - Detailed Implementation Phases

Tai lieu nay chia `VERIFICATION_BACKEND_PYTHON_PLAN.md` thanh cac phase de team co the lam theo tung buoc. Moi phase gom muc tieu, viec can lam, output va tieu chi hoan thanh.

## Tong quan thu tu lam

```text
Phase 0  -> Config, secret, security foundation
Phase 1  -> Database entities va migration
Phase 2  -> Audit log, MongoDB, Redis lock
Phase 3  -> CCCD/CMND verification bang FPT.AI
Phase 4  -> Python AI service skeleton
Phase 5  -> Face enrollment
Phase 6  -> Driver license verification
Phase 7  -> Verification status API
Phase 8  -> Owner application core
Phase 9  -> Owner role approval
Phase 10 -> Vehicle document verification
Phase 11 -> Staff review APIs
Phase 12 -> Risk rules
Phase 13 -> Backend tests
Phase 14 -> Python tests
Phase 15 -> End-to-end integration
```

## Phase 0 - Chuan hoa config va security

### Muc tieu

Tach ro secret, endpoint va rule goi service. Frontend khong duoc giu FPT.AI API key. Backend la noi goi FPT.AI va goi Python service noi bo.

### Viec can lam

- Them config FPT.AI vao backend:

```text
FPT_AI_API_KEY=
FPT_AI_ID_RECOGNITION_URL=https://api.fpt.ai/vision/idr/vnm
FPT_AI_TIMEOUT_SECONDS=30
```

- Them config Python AI service vao backend:

```text
AI_VERIFICATION_API_KEY=
AI_VERIFICATION_BASE_URL=http://localhost:8001
AI_VERIFICATION_TIMEOUT_SECONDS=60
```

- Tao config/options class trong backend cho FPT.AI va Python service.
- Dam bao frontend chi upload/submit anh qua backend, khong goi truc tiep FPT.AI.
- Thong nhat Cloudinary upload qua backend.
- Dam bao khong log raw API key.
- Chuan bi `.env.example` cho backend va Python.

### Output can co

- Backend doc duoc config FPT.AI.
- Backend doc duoc config Python AI service.
- Python co internal API key rieng.
- Co `.env.example` ro rang.

### Done khi

- Khong co API key hard-code trong source code.
- Frontend khong can biet FPT.AI key.
- Backend goi Python bang internal API key.
- Timeout cua FPT.AI va Python co the config duoc.

## Phase 1 - Database foundation

### Muc tieu

Tao nen tang database de luu trang thai verification, owner application va face enrollment.

### Viec can lam

- Kiem tra cac bang hien co:

```text
Users
CustomerProfiles
OwnerProfiles
Roles
UserRoles
VerificationRequests
VehicleDocuments
TrustScores
Disputes
Reports
```

- Them bang `FaceProfiles`.
- Them bang `OwnerApplications`.
- Bo sung field cho `VerificationRequests`:

```text
ExternalProvider
ExternalResultJson
Confidence
DecisionReason
ProcessedAt
```

- Chuan hoa `VerificationRequests.Type`:

```text
NationalId
DriverLicense
FaceEnrollment
VehicleRegistration
VehicleInspection
VehicleInsurance
OwnerApplication
```

- Chuan hoa status chung:

```text
Draft
Pending
Processing
Verified
NeedMoreInfo
ManualReview
RejectedBySystem
RejectedByStaff
ApprovedByStaff
Failed
Cancelled
```

- Chuan hoa status rieng cho owner application:

```text
Draft
PendingVerification
AutoApproved
ManualReview
NeedMoreInfo
ApprovedByStaff
RejectedBySystem
RejectedByStaff
Cancelled
```

### Output can co

- Migration database.
- Entity/model cho `FaceProfiles`.
- Entity/model cho `OwnerApplications`.
- Cap nhat entity/model `VerificationRequests`.
- Repository/service co ban de tao va update verification request.

### Done khi

- Chay migration thanh cong.
- Tao duoc `VerificationRequest`.
- Tao duoc `FaceProfile`.
- Tao duoc `OwnerApplication`.
- Status va type dung theo danh sach da chuan hoa.

## Phase 2 - Audit, MongoDB va Redis lock

### Muc tieu

Co audit log cho ket qua AI va chan viec submit lap nhieu lan.

### Viec can lam

- Tao Mongo collection:

```text
verification_logs
face_match_logs
owner_verification_logs
```

- Tao Redis lock key:

```text
verification:submit_lock:{userId}:{type}
verification:processing:{requestId}
face:enroll_lock:{userId}
owner_application:submit_lock:{userId}
```

- Dat TTL:

```text
submit lock: 1-5 phut
processing lock: 10-30 phut
```

- Tao helper de acquire/release lock.
- Ghi log khi:
  - Goi FPT.AI.
  - Goi Python service.
  - Backend ra decision.
  - Staff approve/reject/request more info.

### Output can co

- Mongo log service.
- Redis lock service.
- Audit schema thong nhat.

### Done khi

- Double submit bi chan.
- Moi decision quan trong co audit log.
- Loi FPT.AI/Python timeout van duoc ghi log.

## Phase 3 - Customer CCCD/CMND verification

### Muc tieu

Backend verify CCCD/CMND bang FPT.AI va cap nhat profile customer.

### API can lam

```text
POST /api/verifications/national-id
```

### Input

```json
{
  "nationalId": "012345678901",
  "frontImageUrl": "https://...",
  "backImageUrl": "https://..."
}
```

### Viec can lam

- Backend tao `VerificationRequest` type `NationalId`.
- Backend goi FPT.AI ID Recognition truc tiep.
- Parse response FPT.AI.
- So khop:
  - So CCCD/CMND.
  - Ho ten.
  - Ngay sinh neu co.
- Luu raw/normalized result vao `VerificationRequests`.
- Update `CustomerProfiles.NationalId`.
- Set `CustomerProfiles.NationalIdVerified = true` neu pass.
- Chuyen `ManualReview` neu confidence thap.
- Chuyen `NeedMoreInfo` neu anh thieu, anh mo, anh loi.

### Output can co

- FPT.AI client trong backend.
- Parser response FPT.AI.
- National ID verification API.
- Status mapping service.

### Done khi

- CCCD hop le verify thanh cong.
- CCCD confidence thap vao `ManualReview`.
- Anh loi/thieu vao `NeedMoreInfo`.
- Raw AI result duoc luu de audit.

## Phase 4 - Python AI service skeleton

### Muc tieu

Tao Python service noi bo co contract on dinh de backend goi.

### Cau truc folder

```text
Src/ai-verification/
  app/
    main.py
    api/
      health.py
      driver_license.py
      vehicle_document.py
      face.py
    services/
      ocr_service.py
      vehicle_document_service.py
      face_service.py
      image_quality_service.py
      recommendation_service.py
    models/
      face_model.py
      ocr_model.py
      document_detector.py
    schemas/
      requests.py
      responses.py
    core/
      config.py
      security.py
      logging.py
  tests/
  requirements.txt
  .env.example
  README.md
```

### API can lam dau tien

```text
GET /health
```

### Viec can lam

- Tao FastAPI app.
- Tao config loader.
- Tao middleware/dependency verify internal API key.
- Tao schema request/response ban dau.
- Tao logging format.
- Tao smoke test cho `/health`.

### Output can co

- Python app chay duoc.
- `/health` tra:

```json
{
  "status": "ok"
}
```

- Backend co the ping Python service.

### Done khi

- Python service start duoc local.
- Request khong co API key bi reject.
- `/health` pass.
- OpenAPI docs hien schema co ban.

## Phase 5 - Face enrollment

### Muc tieu

User chup selfie lan dau, Python match selfie voi anh tren CCCD, backend tao `FaceProfile`.

### Backend API

```text
POST /api/face/enroll
```

### Python API

```text
POST /face/enroll
```

### Input backend

```json
{
  "selfieImageUrl": "https://..."
}
```

### Input Python

```json
{
  "requestId": 3,
  "userId": 10,
  "selfieImageUrl": "https://...",
  "nationalIdFrontImageUrl": "https://..."
}
```

### Viec can lam

- Backend lay CCCD front image URL da verify gan nhat.
- Backend tao `VerificationRequest` type `FaceEnrollment`.
- Backend goi Python `/face/enroll`.
- Python detect face tren selfie.
- Python detect face tren CCCD front image.
- Python check image quality.
- Python match face bang InsightFace/ArcFace.
- Backend luu match score, quality score, flags.
- Neu pass, backend tao `FaceProfiles`.

### Threshold de xuat

```text
matchScore >= 0.75: Pass
0.55 - 0.74: ManualReview
< 0.55: Reject
```

### Done khi

- Selfie hop le tao active `FaceProfile`.
- Selfie khong co mat bi reject/manual review dung rule.
- Selfie nhieu hon mot mat co flag.
- Match score thap khong tao active profile.

## Phase 6 - Driver license verification

### Muc tieu

Verify GPLX bang Python OCR va optional match face tren GPLX voi face da enroll.

### Backend API

```text
POST /api/verifications/driver-license
```

### Python API

```text
POST /verify/driver-license
```

### Viec can lam

- Backend tao `VerificationRequest` type `DriverLicense`.
- Backend goi Python `/verify/driver-license`.
- Python preprocess anh bang OpenCV.
- Python OCR bang PaddleOCR.
- Python parse:
  - Ho ten.
  - So GPLX.
  - Hang GPLX.
  - Ngay het han.
- Backend so khop ho ten va so GPLX.
- Neu GPLX co anh, Python co the match voi enrolled selfie.
- Backend update `CustomerProfiles.DriverLicenseVerified = true` neu pass.

### Done khi

- GPLX hop le set `DriverLicenseVerified = true`.
- GPLX doc khong ro vao `ManualReview`.
- So GPLX khong khop bi reject/manual review theo confidence.
- Python response luon dung schema.

## Phase 7 - Verification status API

### Muc tieu

Frontend co API de xem trang thai verification hien tai cua user.

### API can lam

```text
GET /api/verifications/me
```

### Response

```json
{
  "nationalIdVerified": true,
  "driverLicenseVerified": false,
  "faceEnrolled": true,
  "latestRequests": []
}
```

### Viec can lam

- Lay status tu `CustomerProfiles`.
- Check active `FaceProfiles`.
- Lay latest verification requests.
- Format response on dinh cho frontend.

### Done khi

- Frontend lay duoc status CCCD, GPLX va face enrollment.
- Status thay doi dung sau moi flow verify.

## Phase 8 - Owner application core

### Muc tieu

Customer nop don tro thanh Owner va backend tu tinh risk score.

### API can lam

```text
POST /api/owner-applications
POST /api/owner-applications/me/submit
```

### Validate can co

- Email verified.
- User active.
- User chua co role `Owner`.
- Khong co owner application active.
- `NationalIdVerified = true`.
- Co active `FaceProfile`.
- `DriverLicenseVerified = true` neu business rule yeu cau.
- Bank info hop le.
- Phone format hop le.
- Trust score/dispute khong qua xau.

### Decision

```text
0-20: AutoApproved
21-60: ManualReview
61+: RejectedBySystem
Hard reject: RejectedBySystem
Missing required info: NeedMoreInfo
```

### Done khi

- User tao owner application duoc.
- Submit application tinh risk score dung.
- Missing CCCD/face/bank info vao `NeedMoreInfo`.
- Risk xanh auto approve.
- Risk vang vao staff review.
- Risk do bi reject by system.

## Phase 9 - Owner approval va role update

### Muc tieu

Khi owner application duoc duyet, user duoc cap role Owner va profile owner duoc tao/cap nhat.

### Viec can lam

- Khi status la `AutoApproved` hoac `ApprovedByStaff`:
  - Them role `Owner` vao `UserRoles`.
  - Tao `OwnerProfile` neu chua co.
  - Set `OwnerProfile.IsVerified = true`.
  - Ghi audit log.
  - Revoke/refresh token session de JWT co role moi.

### Done khi

- User duoc cap role Owner dung luc.
- Khong cap role Owner khi application con `ManualReview` hoac `NeedMoreInfo`.
- JWT/session co role moi sau refresh.
- Moi lan approve co audit log.

## Phase 10 - Vehicle document verification

### Muc tieu

Owner upload giay to xe va backend/Python verify loai giay, bien so, thong tin lien quan.

### Backend API

```text
POST /api/vehicles/{vehicleId}/documents
```

### Python API

```text
POST /verify/vehicle-document
```

### Doc types

```text
VehicleRegistration
VehicleInspection
VehicleInsurance
Other
```

### Viec can lam

- Backend tao `VehicleDocument`.
- Backend tao `VerificationRequest` lien quan neu can.
- Backend goi Python `/verify/vehicle-document`.
- Python detect loai giay to.
- Python OCR fields.
- Python parse:
  - Bien so.
  - Chu xe.
  - So khung.
  - So may.
  - Ngay het han neu co.
- Backend so khop voi `Vehicle.LicensePlate`.
- Backend update `VehicleDocuments.Verified`.

### Done khi

- Giay to hop le set `VehicleDocuments.Verified = true`.
- Bien so khong khop reject/manual review theo risk.
- Anh khong doc duoc co flags ro rang.

## Phase 11 - Staff review APIs

### Muc tieu

Staff/Admin xu ly cac case khong the auto decision.

### APIs can lam

```text
GET  /api/staff/verifications
GET  /api/staff/verifications/{id}
POST /api/staff/verifications/{id}/approve
POST /api/staff/verifications/{id}/reject
POST /api/staff/verifications/{id}/request-more-info

GET  /api/staff/owner-applications
GET  /api/staff/owner-applications/{id}
POST /api/staff/owner-applications/{id}/approve
POST /api/staff/owner-applications/{id}/reject
POST /api/staff/owner-applications/{id}/request-more-info
```

### Viec can lam

- Enforce role `Staff` hoac `Admin`.
- List/filter verification requests.
- Detail xem duoc raw result/normalized result/flags.
- Approve/reject/request more info.
- Bat buoc nhap reason khi reject/request more info.
- Ghi `ReviewedBy`, `ReviewedAt`, `RejectionReason` neu co.
- Ghi audit log.

### Done khi

- Staff xu ly duoc `ManualReview`.
- Staff request more info duoc.
- User/application status update dung.
- Moi action cua staff co audit.

## Phase 12 - Risk rules hardening

### Muc tieu

Chuan hoa rule hard reject va risk score de backend decision on dinh.

### Hard reject

```text
User suspended
Email chua verify
CCCD trung owner/customer bi ban
FPT.AI CCCD invalid ro rang
Face selfie mismatch voi CCCD ro rang
Fraud/dispute nghiem trong
Giay to xe bien so khong khop vehicle
```

### Risk score

```text
OCR confidence thap: +20
Face match thap: +40
Ten khong khop: +30
So giay to khong khop: +40
Anh mo/toi: +15
Account moi tao < 24h: +10
TrustScore thap: +25
Co rejected request gan day: +30
Python/FPT timeout: +20 va ManualReview
```

### Decision chung

```text
0-20: AutoApproved/Verified
21-60: ManualReview
61+: RejectedBySystem
Missing required image: NeedMoreInfo
```

### Done khi

- Risk score tinh duoc tu cac flag.
- Timeout khong lam mat request.
- Decision giong rule da thong nhat.
- Co unit test cho cac case xanh/vang/do.

## Phase 13 - Backend test suite

### Muc tieu

Dam bao backend flow khong bi hoi quy.

### Test can co

- CCCD pass tu FPT.AI -> `NationalIdVerified = true`.
- CCCD confidence thap -> `ManualReview`.
- Face enroll pass -> tao `FaceProfile`.
- GPLX pass -> `DriverLicenseVerified = true`.
- Owner xanh -> gan role Owner.
- Owner vang -> staff review.
- Vehicle document pass -> `VehicleDocument.Verified = true`.
- Python timeout -> khong mat request, chuyen `ManualReview` hoac `Failed`.
- Redis lock chan double submit.

### Done khi

- Backend tests pass local.
- Cac flow chinh co test.
- Timeout va error path co test.

## Phase 14 - Python test suite

### Muc tieu

Dam bao Python service tra schema on dinh va flags dung.

### Test can co

- Detect face selfie thanh cong.
- Reject selfie khong co mat.
- Reject selfie nhieu hon mot mat.
- Match selfie vs CCCD pass/fail theo threshold.
- OCR GPLX tra schema on dinh.
- OCR vehicle document tra flags khi khong doc duoc bien so.
- Request khong co internal API key bi reject.

### Done khi

- Python tests pass local.
- Response luon dung schema.
- Flags ro rang cho anh loi/chat luong thap.

## Phase 15 - End-to-end integration

### Muc tieu

Kiem thu luong day du giua backend, FPT.AI, Python, MongoDB, Redis va Cloudinary.

### Flow can test

#### Customer flow

```text
1. User register/login.
2. User upload CCCD front/back.
3. Backend goi FPT.AI.
4. CCCD pass -> NationalIdVerified = true.
5. User chup selfie.
6. Backend goi Python face enroll voi selfie + CCCD front.
7. Python match selfie voi anh tren CCCD.
8. Pass -> tao FaceProfile.
9. User upload GPLX.
10. Backend goi Python OCR GPLX.
11. Neu GPLX co anh, Python match face GPLX voi enrolled selfie.
12. Pass -> DriverLicenseVerified = true.
```

#### Owner flow

```text
1. Customer bam Become Owner.
2. Backend tao OwnerApplication.
3. Backend check CCCD verified.
4. Backend check FaceProfile active.
5. Backend check GPLX neu rule yeu cau.
6. Backend check bank info, phone, trust score, disputes.
7. Backend tinh risk score.
8. Xanh -> AutoApproved, them role Owner.
9. Vang -> ManualReview, staff xem.
10. Do -> RejectedBySystem.
```

#### Vehicle document flow

```text
1. Owner tao vehicle.
2. Owner upload giay to xe.
3. Backend luu VehicleDocument status pending.
4. Backend goi Python verify vehicle document.
5. Python detect doc type, OCR, parse license plate/chassis/expiry.
6. Backend so khop voi Vehicle.LicensePlate.
7. Pass -> VehicleDocument.Verified = true.
8. Khong chac -> ManualReview.
9. Sai ro -> RejectedBySystem.
```

### Done khi

- Full customer flow chay duoc tu dau den cuoi.
- Full owner flow cap role dung.
- Vehicle document verify dung.
- Mongo co log.
- Redis lock hoat dong.
- Error/timeout khong lam hong status chinh.

## Milestone goi y

## M1 - Identity MVP

Gom:

```text
Phase 0
Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
Phase 7
```

Ket qua:

- User verify CCCD duoc.
- User enroll face duoc.
- Frontend xem trang thai verification duoc.

## M2 - Driver + Owner MVP

Gom:

```text
Phase 6
Phase 8
Phase 9
```

Ket qua:

- User verify GPLX duoc.
- User nop owner application duoc.
- Backend cap role Owner theo risk/approval.

## M3 - Vehicle + Staff

Gom:

```text
Phase 10
Phase 11
Phase 12
```

Ket qua:

- Owner verify giay to xe duoc.
- Staff xu ly manual review duoc.
- Risk rules on dinh hon.

## M4 - Production readiness

Gom:

```text
Phase 13
Phase 14
Phase 15
```

Ket qua:

- Co backend tests.
- Co Python tests.
- Co E2E checklist.
- San sang demo/production hardening.

