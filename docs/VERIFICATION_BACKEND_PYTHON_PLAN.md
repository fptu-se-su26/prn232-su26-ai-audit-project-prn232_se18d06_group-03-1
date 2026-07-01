# MoveVN Verification Plan - Backend + Python AI

## 1. Muc Tieu

Xay dung he thong xac minh cho MoveVN gom:

- Customer verify CCCD/CMND.
- Customer verify GPLX.
- Owner application: xac minh danh tinh, khuon mat, giay to lien quan.
- Vehicle documents: dang ky xe, dang kiem, bao hiem, giay to oto/xe may.
- Face enrollment: lan dau chup khuon mat, match voi anh tren CCCD.
- Face matching ve sau: dung anh da enroll de match voi GPLX hoac giay to co anh.

Kien truc chinh:

- ASP.NET backend goi FPT.AI truc tiep de OCR CCCD/CMND.
- Python service chi xu ly GPLX, giay to xe, face detection, face matching, image quality.
- Frontend khong bao gio giu FPT.AI API key.
- Backend la noi quyet dinh status, risk score, role Owner, va update DB.

## 2. Vi Tri API Key

FPT.AI API key nen de trong backend ASP.NET:

```text
FPT_AI_API_KEY=
FPT_AI_ID_RECOGNITION_URL=https://api.fpt.ai/vision/idr/vnm
FPT_AI_TIMEOUT_SECONDS=30
```

Ly do:

- Backend goi FPT.AI truc tiep cho CCCD.
- Khong expose key ra frontend.
- Python khong can biet FPT key neu Python khong xu ly CCCD OCR.
- Log/audit va retry de kiem soat tai backend.

Python co API key rieng de backend goi noi bo:

```text
AI_VERIFICATION_API_KEY=
AI_VERIFICATION_BASE_URL=http://localhost:8001
AI_VERIFICATION_TIMEOUT_SECONDS=60
```

Cloudinary key co the de o backend neu backend upload anh, hoac Python neu Python can upload processed/cropped face. Khuyen nghi:

- Frontend upload anh goc qua backend.
- Backend upload anh len Cloudinary.
- Python chi nhan URL anh tu backend va tra ket qua AI.

## 3. Data Stores

### SQL/PostgreSQL

Nguon trang thai chinh:

- `Users`
- `CustomerProfiles`
- `OwnerProfiles`
- `Roles`
- `UserRoles`
- `VerificationRequests`
- `VehicleDocuments`
- `TrustScores`
- `Disputes`
- `Reports`

Can them bang/field:

```text
OwnerApplications
FaceProfiles
VerificationRequests.ExternalProvider
VerificationRequests.ExternalResultJson
VerificationRequests.Confidence
VerificationRequests.DecisionReason
VerificationRequests.ProcessedAt
```

### MongoDB

Dung de luu audit/raw AI result:

```text
verification_logs
face_match_logs
owner_verification_logs
```

Khong dung Mongo lam status chinh.

### Redis

Dung cho lock/cache ngan han:

```text
verification:submit_lock:{userId}:{type}
verification:processing:{requestId}
face:enroll_lock:{userId}
owner_application:submit_lock:{userId}
```

TTL:

```text
submit lock: 1-5 phut
processing lock: 10-30 phut
```

## 4. Core SQL Entities Can Them

### `FaceProfiles`

Luu face enrollment cua user.

```text
Id
UserId
SelfieImageUrl
FaceEmbeddingRef
FaceProvider
FaceQualityScore
CccdMatchScore
IsActive
EnrolledAt
CreatedAt
UpdatedAt
```

Ghi chu:

- `SelfieImageUrl` la anh selfie da upload len Cloudinary.
- `FaceEmbeddingRef` nen la reference den encrypted embedding, khong nen public.
- Neu chua muon luu embedding, co the chi luu selfie URL va moi lan match Python tinh lai.

### `OwnerApplications`

```text
Id
UserId
Status
BusinessName
TaxCode
BankName
BankAccountNumber
RiskScore
RiskBand
DecisionReason
SubmittedAt
ReviewedBy
ReviewedAt
RejectionReason
CreatedAt
UpdatedAt
```

Mot user chi co mot owner application active tai mot thoi diem.

## 5. Verification Types

Dung trong `VerificationRequests.Type`:

```text
NationalId
DriverLicense
FaceEnrollment
VehicleRegistration
VehicleInspection
VehicleInsurance
OwnerApplication
```

## 6. Status

Status chung:

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

Owner application status:

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

Khi owner duoc `AutoApproved` hoac `ApprovedByStaff`:

- Them role `Owner` vao `UserRoles`.
- Tao `OwnerProfile` neu chua co.
- Set `OwnerProfile.IsVerified = true`.
- Revoke/refresh token session de JWT co role moi.

## 7. Backend APIs - Customer Verification

### `POST /api/verifications/national-id`

Muc dich:

- Xac minh CCCD/CMND bang FPT.AI.

Input:

```json
{
  "nationalId": "012345678901",
  "frontImageUrl": "https://...",
  "backImageUrl": "https://..."
}
```

Flow:

- Backend tao `VerificationRequest` type `NationalId`.
- Backend goi FPT.AI ID Recognition truc tiep.
- Backend parse response FPT.AI.
- So khop `nationalId`, `fullName`, ngay sinh neu co.
- Neu hop le: cap nhat `CustomerProfiles.NationalId` va `NationalIdVerified = true`.
- Neu confidence thap: `ManualReview`.
- Neu thieu/anh mo: `NeedMoreInfo`.

### `POST /api/verifications/driver-license`

Muc dich:

- Xac minh GPLX bang Python OCR.

Input:

```json
{
  "driverLicenseNumber": "790012345678",
  "frontImageUrl": "https://...",
  "backImageUrl": "https://..."
}
```

Flow:

- Backend tao `VerificationRequest` type `DriverLicense`.
- Backend goi Python `POST /verify/driver-license`.
- Python OCR va tra extracted fields.
- Backend so khop ho ten, so GPLX.
- Neu pass: set `CustomerProfiles.DriverLicenseVerified = true`.
- Neu khong chac: `ManualReview`.

### `GET /api/verifications/me`

Tra ve:

```json
{
  "nationalIdVerified": true,
  "driverLicenseVerified": false,
  "faceEnrolled": true,
  "latestRequests": []
}
```

## 8. Backend APIs - Face Enrollment

## 8.1 CCCD Reuse Cho Customer Va Owner

Owner cung bat buoc phai xac minh CCCD. Tuy nhien khong can tao mot flow CCCD rieng khac cho Owner.

Quy tac:

- Neu user da verify CCCD khi la Customer, Owner application se dung lai ket qua do.
- Neu user dang ky Owner truc tiep ma chua verify CCCD, backend chay flow `NationalId` truoc, sau do moi tiep tuc owner application.
- Ket qua CCCD sau khi FPT.AI verify thanh cong duoc luu vao SQL, vi du `CustomerProfiles.NationalId`, `DateOfBirth`, `Address`, `NationalIdVerified = true`, va raw/normalized result trong `VerificationRequests`.
- Owner application chi can check `NationalIdVerified = true`, khong bat user upload lai CCCD neu CCCD con hop le.

Luu y quan trong:

- FPT.AI dung de OCR CCCD: doc so CCCD, ho ten, ngay sinh, dia chi, confidence.
- Python dung de face matching: so sanh selfie user chup voi khuon mat tren anh CCCD.
- Backend khong nhat thiet phai cat anh CCCD truoc khi gui Python.
- Backend chi can gui `selfieImageUrl` va `nationalIdFrontImageUrl` cho Python.
- Python tu detect/crop face tren anh CCCD bang face detector, detect/crop face tren selfie, roi match embedding.
- Neu sau nay FPT.AI/eKYC tra ve portrait crop rieng thi backend co the gui portrait crop URL cho Python de tang do on dinh, nhung day khong phai dieu kien bat buoc.

Flow dung:

```text
1. Backend goi FPT.AI de OCR CCCD.
2. Backend luu thong tin CCCD xuong SQL.
3. User chup selfie lan dau.
4. Backend upload/nhan selfie URL Cloudinary.
5. Backend goi Python voi selfie URL + CCCD front image URL.
6. Python tu detect face tren hai anh va match.
7. Neu match pass, backend tao FaceProfile va gan voi user.
8. Owner application dung lai NationalIdVerified + FaceProfile de tinh risk score.
```

### `POST /api/face/enroll`

Muc dich:

- Lan dau user chup khuon mat.
- Match selfie voi anh chan dung tren CCCD.
- Luu anh selfie len Cloudinary.

Input:

```json
{
  "selfieImageUrl": "https://..."
}
```

Dieu kien:

- User da verify CCCD hoac da co CCCD front image trong verification request.
- CCCD FPT.AI da pass hoac dang duoc dung trong cung flow.

Flow:

- Backend lay CCCD front image URL da verify gan nhat.
- Backend goi Python `POST /face/enroll`.
- Python detect face tren selfie.
- Python detect face tren anh CCCD.
- Python match selfie vs CCCD portrait.
- Neu pass: backend upload/giu selfie URL Cloudinary va tao `FaceProfiles`.
- Neu khong pass: `ManualReview` hoac `RejectedBySystem` tuy score.

Response:

```json
{
  "faceEnrolled": true,
  "matchScore": 0.82,
  "qualityScore": 0.91
}
```

### `POST /api/face/match-document`

Muc dich:

- Match face da enroll voi anh tren giay to khac, vi du GPLX.

Input:

```json
{
  "documentType": "DriverLicense",
  "documentImageUrl": "https://..."
}
```

Flow:

- Backend lay active `FaceProfile`.
- Backend goi Python `POST /face/match-document`.
- Python detect face tren giay to.
- Python match voi enrolled selfie hoac embedding.
- Backend luu ket qua vao `VerificationRequest`/Mongo log.

## 9. Backend APIs - Vehicle Documents

### `POST /api/vehicles/{vehicleId}/documents`

Muc dich:

- Owner upload giay to xe.

Doc types:

```text
VehicleRegistration
VehicleInspection
VehicleInsurance
Other
```

Input:

```json
{
  "docType": "VehicleRegistration",
  "fileUrl": "https://..."
}
```

Flow:

- Backend tao `VehicleDocument`.
- Backend tao `VerificationRequest` lien quan neu can.
- Backend goi Python `POST /verify/vehicle-document`.
- Python detect loai giay to, OCR fields, doc quality.
- Backend update `VehicleDocuments.Verified` neu pass.

## 10. Backend APIs - Owner Application

### `POST /api/owner-applications`

Muc dich:

- Customer xin tro thanh owner.

Validate:

- Email verified.
- User active.
- Chua co role Owner.
- Khong co owner application active.

### `POST /api/owner-applications/me/submit`

Flow:

- Check `NationalIdVerified = true`.
- Check `FaceProfiles.IsActive = true`.
- Check `DriverLicenseVerified` neu business rule yeu cau.
- Check bank info, phone format, trust score, dispute.
- Tinh risk score.
- Quyet dinh xanh/vang/do.

Decision:

```text
0-20: AutoApproved
21-60: ManualReview
61+: RejectedBySystem
Hard reject: RejectedBySystem
Missing required info: NeedMoreInfo
```

### Staff APIs

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

## 11. Python Service APIs

Python folder:

```text
Src/ai-verification
```

### `GET /health`

```json
{
  "status": "ok"
}
```

### `POST /verify/driver-license`

Input:

```json
{
  "requestId": 1,
  "userId": 10,
  "fullName": "Nguyen Van A",
  "driverLicenseNumber": "790012345678",
  "frontImageUrl": "https://...",
  "backImageUrl": "https://..."
}
```

Output:

```json
{
  "valid": true,
  "ocrConfidence": 0.88,
  "extracted": {
    "fullName": "Nguyen Van A",
    "driverLicenseNumber": "790012345678",
    "licenseClass": "B2",
    "expiryDate": "2030-01-01"
  },
  "flags": [],
  "recommendation": "Pass"
}
```

### `POST /verify/vehicle-document`

Input:

```json
{
  "requestId": 2,
  "vehicleId": 99,
  "docType": "VehicleRegistration",
  "fileUrl": "https://...",
  "licensePlate": "51A-12345"
}
```

Output:

```json
{
  "valid": true,
  "detectedDocType": "VehicleRegistration",
  "ocrConfidence": 0.81,
  "extracted": {
    "licensePlate": "51A-12345",
    "ownerName": "Nguyen Van A",
    "chassisNumber": "...",
    "engineNumber": "...",
    "expiryDate": null
  },
  "flags": [],
  "recommendation": "Pass"
}
```

### `POST /face/enroll`

Input:

```json
{
  "requestId": 3,
  "userId": 10,
  "selfieImageUrl": "https://...",
  "nationalIdFrontImageUrl": "https://..."
}
```

Output:

```json
{
  "valid": true,
  "selfieQualityScore": 0.91,
  "cccdFaceDetected": true,
  "selfieFaceDetected": true,
  "matchScore": 0.82,
  "embeddingRef": "face-embedding-ref",
  "flags": [],
  "recommendation": "Pass"
}
```

### `POST /face/match-document`

Input:

```json
{
  "requestId": 4,
  "userId": 10,
  "enrolledSelfieImageUrl": "https://...",
  "documentImageUrl": "https://...",
  "documentType": "DriverLicense"
}
```

Output:

```json
{
  "valid": true,
  "documentFaceDetected": true,
  "matchScore": 0.79,
  "flags": [],
  "recommendation": "Pass"
}
```

## 12. Model Va Huong Giai Quyet

### CCCD/CMND

- Dung FPT.AI ID Recognition truc tiep tu backend.
- FPT.AI tra extracted fields va probability/confidence.
- Backend so khop data va luu status.

### GPLX OCR

Khuyen nghi:

- OCR: PaddleOCR.
- Preprocess: OpenCV.
- Field parser: regex + rule parser tieng Viet.
- Neu anh kem/chat luong thap: day sang `ManualReview`.

### Vehicle Documents OCR

Khuyen nghi:

- Document detection/crop: YOLO11 custom dataset neu anh thuc te nhieu background.
- OCR: PaddleOCR.
- Parser theo tung loai:
  - VehicleRegistration
  - VehicleInspection
  - VehicleInsurance

Ban dau co the chua train YOLO, dung OpenCV crop/quality + PaddleOCR full image. Neu ket qua kem thi them YOLO custom.

### Face Matching

Khuyen nghi:

- Face detection: InsightFace SCRFD hoac RetinaFace.
- Face embedding/matching: InsightFace ArcFace.
- Image quality: OpenCV blur/brightness checks.

Threshold de xuat:

```text
matchScore >= 0.75: Pass
0.55 - 0.74: ManualReview
< 0.55: Reject
```

Threshold phai benchmark lai bang anh that cua du an.

## 13. Full Customer Flow

```text
1. User register/login.
2. User upload CCCD front/back.
3. Backend goi FPT.AI.
4. CCCD pass -> NationalIdVerified = true.
5. User chup selfie.
6. Backend goi Python face enroll voi selfie + CCCD front.
7. Python match selfie voi anh tren CCCD.
8. Pass -> tao FaceProfile, luu selfie Cloudinary URL.
9. User upload GPLX.
10. Backend goi Python OCR GPLX.
11. Neu GPLX co anh, Python match face GPLX voi enrolled selfie.
12. Pass -> DriverLicenseVerified = true.
```

## 14. Full Owner Flow

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

## 15. Full Vehicle Document Flow

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

## 16. Risk Rules

Hard reject:

```text
User suspended
Email chua verify
CCCD trung owner/customer bi ban
FPT.AI CCCD invalid ro rang
Face selfie mismatch voi CCCD ro rang
Fraud/dispute nghiem trong
Giay to xe bien so khong khop vehicle
```

Risk score:

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

Decision:

```text
0-20: AutoApproved/Verified
21-60: ManualReview
61+: RejectedBySystem
Missing required image: NeedMoreInfo
```

## 17. Security

- Khong expose FPT.AI key ra frontend.
- Backend goi Python bang internal API key.
- Anh giay to va selfie la du lieu nhay cam, URL Cloudinary nen private/signed neu co the.
- Khong log raw API key.
- Han che luu embedding raw; neu luu thi encrypt.
- Staff access can role `Staff` hoac `Admin`.
- Tat ca approval/reject phai ghi audit log.

## 18. Suggested Python Structure

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

## 19. Test Plan

Backend:

- CCCD pass tu FPT.AI -> `NationalIdVerified = true`.
- CCCD confidence thap -> `ManualReview`.
- Face enroll pass -> tao `FaceProfile`.
- GPLX pass -> `DriverLicenseVerified = true`.
- Owner xanh -> gan role Owner.
- Owner vang -> staff review.
- Vehicle document pass -> `VehicleDocument.Verified = true`.
- Python timeout -> khong mat request, chuyen `ManualReview` hoac `Failed`.

Python:

- Detect face selfie thanh cong.
- Reject selfie khong co mat.
- Reject selfie nhieu hon mot mat.
- Match selfie vs CCCD pass/fail theo threshold.
- OCR GPLX tra schema on dinh.
- OCR vehicle document tra flags khi khong doc duoc bien so.

Integration:

- Backend -> FPT.AI CCCD.
- Backend -> Python face enroll.
- Backend -> Python GPLX.
- Backend -> Python vehicle document.
- Mongo ghi log.
- Redis lock chan double submit.

## 20. References

- FPT.AI ID Recognition: https://docs.fpt.ai/docs/en/vision/documentation/id-recognition.html
- FPT.AI ID Recognition API: https://docs.fpt.ai/docs/en/vision/tutorials/id-recognition/
- InsightFace: https://github.com/deepinsight/insightface
- PaddleOCR: https://github.com/PaddlePaddle/PaddleOCR
- Ultralytics YOLO docs: https://docs.ultralytics.com/
