# MoveVN Owner Onboarding + CCCD Verification Plan

## 1. Muc Tieu

Xay dung luong dang ky Owner rieng, khong cap role `Owner` chi vi user chon role luc register.

Owner trong MoveVN duoc hieu la:

```text
Owner = Customer + OwnerProfile verified + role Owner
```

Moi user tro thanh Owner bat buoc phai:

- Co tai khoan `Users`.
- Co role `Customer`.
- Co `CustomerProfiles`.
- Xac minh CCCD bang FPT.AI.
- Co thong tin bank/owner profile.
- Duoc backend cap them role `Owner`.

Giai doan nay chua bat buoc `FaceProfile`.

## 2. Nguyen Tac Chinh

### 2.1 Register public

Trang dang ky public binh thuong chi tao `Customer`.

Khong cho user chon `Owner` truc tiep o form `/register`.

### 2.2 Owner luon co role Customer

Khi user thanh Owner, `UserRoles` phai co ca:

```text
Customer
Owner
```

Khong thay role Customer bang Owner.

### 2.3 CCCD dung chung cho Customer va Owner

CCCD la thong tin dinh danh cua user, khong phai thong tin rieng cua Owner.

Ket qua CCCD verified luu trong:

```text
CustomerProfiles
```

Lich su upload/verify CCCD luu trong:

```text
VerificationRequests
```

Owner application chi can check:

```text
CustomerProfiles.NationalIdVerified = true
```

### 2.4 Anh CCCD

Anh CCCD luu tren Cloudinary, DB chi luu `public_id`.

Khuyen nghi:

```text
FrontImagePublicId NOT NULL
BackImagePublicId NULL
```

Rule theo type:

```text
NationalId: bat buoc front + back
DriverLicense: bat buoc front, back optional
VehicleDocument: bat buoc front, back optional
```

Rule bat buoc 2 mat cua CCCD nam o service/API validation, khong ep tat ca document phai co back image o DB.

## 3. DB Lien Quan

### 3.1 `Users`

Muc dich:

- Tai khoan chinh.
- Login.
- Email/phone/full name.
- Trang thai account.

Lien quan owner:

- Owner application gan voi `UserId`.
- User phai `Active`.
- User nen `IsEmailVerified = true` truoc khi submit owner.

Field quan trong:

```text
Id
Email
PasswordHash
FullName
Phone
Status
IsEmailVerified
CreatedAt
UpdatedAt
```

### 3.2 `Roles`

Muc dich:

- Dinh nghia cac role he thong.

Role lien quan:

```text
Customer
Owner
Admin
Staff
```

### 3.3 `UserRoles`

Muc dich:

- Quyet dinh user co quyen gi.

Ket qua cuoi owner:

```text
UserId + Customer role
UserId + Owner role
```

Khi owner application duoc approve, backend them record role `Owner` neu chua co.

### 3.4 `CustomerProfiles`

Muc dich:

- Ho so dinh danh dung chung cho Customer va Owner.
- Luu ket qua CCCD/GPLX verified.

Field lien quan:

```text
UserId
DateOfBirth
Address
NationalId
NationalIdHash
NationalIdMasked
NationalIdVerified
DriverLicenseNumber
DriverLicenseVerified
PreferredVehicleType
```

Vai tro trong luong Owner:

- `NationalIdVerified = true` la dieu kien bat buoc.
- `NationalIdHash` dung de check trung CCCD.
- `NationalIdMasked` dung de hien thi an toan, vi du `********1234`.
- `NationalId` neu luu plain thi nen can nhac encrypt ve sau.

### 3.5 `VerificationRequests`

Muc dich:

- Luu moi lan user upload giay to va ket qua verify.
- Luu Cloudinary public id.
- Luu response FPT.AI.
- Lam audit cho staff review.

Field lien quan:

```text
Id
UserId
Type
FrontImagePublicId
BackImagePublicId
FrontImageUrl
BackImageUrl
SelfieUrl
Status
ExternalProvider
ExternalResultJson
Confidence
DecisionReason
ProcessedAt
ReviewedBy
ReviewedAt
RejectionReason
CreatedAt
ExpiresAt
DeletedAt
```

Type dung cho CCCD:

```text
NationalId
```

Status goi y:

```text
Pending
Processing
Verified
NeedMoreInfo
ManualReview
Rejected
Failed
Cancelled
```

FPT.AI mapping:

```text
ExternalProvider = FPT_AI
ExternalResultJson = raw/normalized response tu FPT.AI
Confidence = confidence tong hop
DecisionReason = ly do pass/fail/manual review
ProcessedAt = thoi diem FPT.AI xu ly xong
```

### 3.6 `OwnerApplications`

Muc dich:

- Luu don xin tro thanh Owner.
- Dung chung cho 3 luong:
  - Customer hien tai bam Become Owner.
  - User moi dang ky lam Owner.
  - Admin/Staff tao Owner.

Field:

```text
Id
UserId
Status
NationalIdVerificationRequestId
BankName
BankAccountNumber
BankAccountHolderName
SubmittedAt
ApprovedAt
ApprovedBy
RejectedAt
RejectedBy
RejectionReason
CreatedAt
UpdatedAt
```

Status goi y:

```text
Draft
WaitingEmailVerification
WaitingCccdVerification
WaitingBankInfo
ReadyToSubmit
Approved
ManualReview
NeedMoreInfo
Rejected
Cancelled
```

Y nghia:

- `Draft`: vua tao application.
- `WaitingEmailVerification`: user moi dang ky owner nhung chua verify email.
- `WaitingCccdVerification`: chua co CCCD verified.
- `WaitingBankInfo`: da verified CCCD nhung thieu bank.
- `ReadyToSubmit`: du thong tin de submit.
- `Approved`: da cap role Owner.
- `ManualReview`: can Staff/Admin xem.
- `NeedMoreInfo`: can user bo sung.
- `Rejected`: bi tu choi.
- `Cancelled`: user huy.

### 3.7 `OwnerProfiles`

Muc dich:

- Luu thong tin owner sau khi duoc duyet.
- Luu bank/profile chinh thuc cua owner.

Field lien quan:

```text
UserId
BankAccountNumber
BankName
BankAccountHolderName
Tier
CommissionRate
TotalTrips
AverageRating
IsVerified
VerifiedAt
```

Vai tro:

- `IsVerified = true` khi owner application approved.
- `VerifiedAt` la thoi diem user thanh Owner.
- Bank info co the copy tu `OwnerApplications` sang `OwnerProfiles` khi approve.

### 3.8 `OtpCodes`

Muc dich:

- Verify email khi dang ky user moi.
- Khong dung de verify CCCD.

### 3.9 `RefreshTokens` va Redis session

Muc dich:

- JWT hien tai chua co role moi neu user dang login truoc khi duoc cap Owner.

Sau khi approve Owner:

- Them role `Owner` vao SQL.
- Yeu cau frontend refresh session hoac login lai.
- Ve sau co the revoke Redis `session:{jti}` de bat buoc cap token moi.

## 4. Cloudinary Luu Anh CCCD

### 4.1 Backend upload

Frontend khong upload truc tiep len Cloudinary neu anh nhay cam.

Flow khuyen nghi:

```text
Frontend chon anh
-> POST multipart den backend
-> Backend upload Cloudinary
-> Backend luu public_id vao VerificationRequests
```

### 4.2 Folder

Goi y folder:

```text
movevn/private/identity/{userId}/{verificationRequestId}/front
movevn/private/identity/{userId}/{verificationRequestId}/back
```

### 4.3 DB chi luu public id

Khuyen nghi DB luu:

```text
FrontImagePublicId
BackImagePublicId
```

Khong nen luu URL public vinh vien cho CCCD.

Khi staff can xem anh:

```text
Backend lay public_id
-> tao signed URL ngan han
-> tra cho frontend
```

## 5. FPT.AI CCCD Verification

### 5.1 Env can co

Them vao backend `.env`:

```text
FPT_AI_API_KEY=
FPT_AI_ID_RECOGNITION_URL=https://api.fpt.ai/vision/idr/vnm
FPT_AI_TIMEOUT_SECONDS=30

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 5.2 Flow backend

```text
1. User upload CCCD front/back.
2. Backend validate user + file.
3. Backend tao VerificationRequest type NationalId status Processing.
4. Backend upload 2 anh len Cloudinary.
5. Backend luu FrontImagePublicId + BackImagePublicId.
6. Backend goi FPT.AI.
7. Backend parse response.
8. Backend so khop fullName/CCCD neu can.
9. Neu pass:
   - CustomerProfiles.NationalId = extracted id
   - CustomerProfiles.NationalIdHash = hash
   - CustomerProfiles.NationalIdMasked = masked
   - CustomerProfiles.DateOfBirth = extracted dob
   - CustomerProfiles.Address = extracted address
   - CustomerProfiles.NationalIdVerified = true
   - VerificationRequests.Status = Verified
10. Neu thieu/anh mo/confidence thap:
   - VerificationRequests.Status = NeedMoreInfo hoac ManualReview
11. Neu fail ro:
   - VerificationRequests.Status = Rejected
```

## 6. Backend APIs Can Code

## 6.1 Auth/Register

### `POST /api/auth/register`

Muc dich:

- Dang ky user binh thuong.
- Chi tao Customer.

Request:

```json
{
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "phone": "0912345678",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

Backend:

- Khong nhan role tu frontend hoac chi chap nhan `Customer`.
- Tao `Users`.
- Tao `UserRoles` role `Customer`.
- Tao `CustomerProfiles`.
- Tao OTP email.

DB:

```text
Users
UserRoles
CustomerProfiles
OtpCodes
```

## 6.2 Owner onboarding cho user moi

### `POST /api/owner-onboarding/register`

Muc dich:

- User moi chon "Dang ky lam chu xe".
- Tao account Customer truoc.
- Tao owner application draft.
- Chua cap role Owner.

Request:

```json
{
  "fullName": "Nguyen Van A",
  "email": "owner@example.com",
  "phone": "0912345678",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

Backend:

- Tao `Users`.
- Them role `Customer`.
- Tao `CustomerProfiles`.
- Tao `OwnerApplications` status `WaitingEmailVerification`.
- Tao OTP email.

Response:

```json
{
  "userId": 10,
  "ownerApplicationId": 5,
  "nextStep": "VerifyEmail"
}
```

DB:

```text
Users
UserRoles
CustomerProfiles
OwnerApplications
OtpCodes
```

## 6.3 Tao owner application cho customer hien tai

### `POST /api/owner-applications`

Auth:

```text
Authorize Customer
```

Muc dich:

- Customer dang login bam Become Owner.

Validate:

- User active.
- Email verified.
- Co role `Customer`.
- Chua co role `Owner`.
- Khong co owner application active.

Backend:

- Tao `OwnerApplications`.
- Neu `CustomerProfiles.NationalIdVerified = true`:
  - Status `WaitingBankInfo`.
- Neu chua verified CCCD:
  - Status `WaitingCccdVerification`.

Response:

```json
{
  "id": 5,
  "status": "WaitingCccdVerification",
  "nextStep": "UploadNationalId"
}
```

DB:

```text
OwnerApplications
CustomerProfiles
UserRoles
```

## 6.4 Lay owner application hien tai

### `GET /api/owner-applications/me`

Auth:

```text
Authorize Customer
```

Response:

```json
{
  "id": 5,
  "status": "WaitingBankInfo",
  "nationalIdVerified": true,
  "bankInfoCompleted": false,
  "isOwner": false,
  "nextStep": "BankInfo"
}
```

DB:

```text
OwnerApplications
CustomerProfiles
OwnerProfiles
UserRoles
```

## 6.5 Upload va verify CCCD

### `POST /api/owner-applications/me/national-id`

Auth:

```text
Authorize Customer
```

Content type:

```text
multipart/form-data
```

Request:

```text
frontImage: file, required
backImage: file, required
```

Rule:

- CCCD bat buoc 2 mat.
- Front/back file bat buoc.
- Chi cho image jpg/png/webp.
- Gioi han dung luong, vi du 5MB/file.

Backend:

- Lay owner application active.
- Tao hoac cap nhat `VerificationRequests` type `NationalId`.
- Upload front/back len Cloudinary.
- Luu `FrontImagePublicId`, `BackImagePublicId`.
- Goi FPT.AI.
- Cap nhat `VerificationRequests`.
- Neu verified, cap nhat `CustomerProfiles`.
- Cap nhat `OwnerApplications.Status`.

Response pass:

```json
{
  "status": "Verified",
  "nationalIdVerified": true,
  "ownerApplicationStatus": "WaitingBankInfo",
  "nextStep": "BankInfo"
}
```

Response can bo sung:

```json
{
  "status": "NeedMoreInfo",
  "nationalIdVerified": false,
  "message": "Anh CCCD khong ro. Vui long upload lai."
}
```

DB:

```text
VerificationRequests
CustomerProfiles
OwnerApplications
```

External:

```text
Cloudinary
FPT.AI
```

## 6.6 Cap nhat bank/owner info

### `PUT /api/owner-applications/me/bank`

Auth:

```text
Authorize Customer
```

Request:

```json
{
  "bankName": "Vietcombank",
  "bankAccountNumber": "0123456789",
  "bankAccountHolderName": "NGUYEN VAN A"
}
```

Validate:

- Owner application active.
- `bankName` required.
- `bankAccountNumber` required.
- `bankAccountHolderName` required.
- Co the validate holder name trung voi user full name sau.

Backend:

- Luu bank info vao `OwnerApplications`.
- Neu `CustomerProfiles.NationalIdVerified = true`, set status `ReadyToSubmit`.
- Neu chua verified CCCD, set status `WaitingCccdVerification`.

Response:

```json
{
  "status": "ReadyToSubmit",
  "nextStep": "ReviewSubmit"
}
```

DB:

```text
OwnerApplications
CustomerProfiles
```

## 6.7 Submit owner application

### `POST /api/owner-applications/me/submit`

Auth:

```text
Authorize Customer
```

Validate:

- User active.
- Email verified.
- Co role Customer.
- Chua co role Owner.
- `CustomerProfiles.NationalIdVerified = true`.
- Owner application co bank info day du.
- Application status `ReadyToSubmit`.

Giai doan dau co the auto approve neu du dieu kien.

Backend auto approve:

- Set `OwnerApplications.Status = Approved`.
- Set `ApprovedAt`.
- Them role `Owner` vao `UserRoles`.
- Tao/cap nhat `OwnerProfiles`.
- Copy bank info tu `OwnerApplications` sang `OwnerProfiles`.
- Set `OwnerProfiles.IsVerified = true`.
- Set `OwnerProfiles.VerifiedAt`.
- Yeu cau frontend refresh token/login lai.

Response:

```json
{
  "status": "Approved",
  "isOwner": true,
  "requiresTokenRefresh": true,
  "nextStep": "OwnerDashboard"
}
```

DB:

```text
OwnerApplications
CustomerProfiles
OwnerProfiles
UserRoles
Roles
RefreshTokens
```

## 6.8 Admin/Staff tao Owner

### `POST /api/admin/owners`

Auth:

```text
Authorize Admin
```

Muc dich:

- Admin tao account Owner noi bo.
- Van tao role Customer + Owner.
- Van can CCCD verified va bank info.

Request co the chia thanh wizard rieng, hoac endpoint tong hop:

```json
{
  "fullName": "Nguyen Van A",
  "email": "owner@example.com",
  "phone": "0912345678",
  "password": "Password123",
  "nationalId": "012345678901",
  "nationalIdVerified": true,
  "bankName": "Vietcombank",
  "bankAccountNumber": "0123456789",
  "bankAccountHolderName": "NGUYEN VAN A"
}
```

Khuyen nghi:

- Neu Admin upload CCCD, van di qua FPT.AI.
- Chi Admin moi duoc override `NationalIdVerified = true`.
- Staff nen chi review/approve, khong nen tao owner verified neu khong co quyen.

DB:

```text
Users
UserRoles
CustomerProfiles
OwnerApplications
VerificationRequests
OwnerProfiles
```

## 6.9 Staff review

### `GET /api/staff/owner-applications`

Filter:

```text
status
keyword
fromDate
toDate
```

### `GET /api/staff/owner-applications/{id}`

Tra chi tiet:

- User info.
- Customer profile.
- CCCD verification request.
- Signed URL anh CCCD.
- Bank info.
- Application status.

### `POST /api/staff/owner-applications/{id}/approve`

Backend:

- Chi approve khi CCCD verified va bank info day du.
- Them role Owner.
- Tao/cap nhat OwnerProfile.
- Set application approved.

### `POST /api/staff/owner-applications/{id}/reject`

Request:

```json
{
  "reason": "Thong tin khong hop le"
}
```

### `POST /api/staff/owner-applications/{id}/request-more-info`

Request:

```json
{
  "reason": "Can upload lai anh mat sau CCCD"
}
```

## 7. Frontend Flow

## 7.1 Flow A - Customer hien tai Become Owner

Route goi y:

```text
/become-owner
```

Step:

```text
1. Customer login.
2. Bam Become Owner.
3. FE goi POST /api/owner-applications.
4. FE goi GET /api/owner-applications/me de lay nextStep.
5. Neu chua CCCD verified:
   - Man Upload CCCD front/back.
   - Goi POST /api/owner-applications/me/national-id.
6. Neu da CCCD verified:
   - Bo qua upload CCCD.
7. Man Bank Info.
   - Goi PUT /api/owner-applications/me/bank.
8. Man Review.
   - Hien CCCD status masked.
   - Hien bank info.
   - Goi POST /api/owner-applications/me/submit.
9. Neu Approved:
   - Refresh session/login lai.
   - Dieu huong /owner.
10. Neu NeedMoreInfo:
   - Quay ve step can bo sung.
11. Neu ManualReview:
   - Hien trang "Dang cho duyet".
```

Man hinh:

```text
BecomeOwnerIntro
NationalIdUploadPage
OwnerBankInfoPage
OwnerApplicationReviewPage
OwnerApplicationResultPage
```

## 7.2 Flow B - User moi dang ky lam Owner

Route goi y:

```text
/register-owner
```

Step:

```text
1. User vao /register-owner.
2. Nhap account info.
3. FE goi POST /api/owner-onboarding/register.
4. Dieu huong /verify-email?purpose=Register.
5. Verify OTP thanh cong.
6. Login hoac auto-login neu backend ho tro.
7. Dieu huong /become-owner/continue.
8. FE goi GET /api/owner-applications/me.
9. Upload CCCD front/back.
10. Dien bank info.
11. Submit.
12. Approved -> refresh token/login lai -> /owner.
```

Man hinh:

```text
OwnerRegisterPage
VerifyEmailPage
NationalIdUploadPage
OwnerBankInfoPage
OwnerApplicationReviewPage
OwnerApplicationResultPage
```

## 7.3 Flow C - Admin/Staff tao Owner

Route goi y:

```text
/admin/owners/create
/staff/owner-applications
```

Admin create flow:

```text
1. Admin nhap account info.
2. Admin upload CCCD front/back hoac yeu cau user upload sau.
3. Backend goi FPT.AI neu co upload CCCD.
4. Admin nhap bank info.
5. Submit tao Owner.
6. Backend tao User + CustomerProfile + OwnerApplication + OwnerProfile + Customer/Owner roles.
```

Staff review flow:

```text
1. Staff vao danh sach owner applications.
2. Xem detail.
3. Xem signed URL CCCD.
4. Approve/Reject/RequestMoreInfo.
```

## 8. Frontend State Mapping

`nextStep` backend tra ve nen map nhu sau:

```text
VerifyEmail -> /verify-email
UploadNationalId -> /become-owner/national-id
BankInfo -> /become-owner/bank
ReviewSubmit -> /become-owner/review
ManualReview -> /become-owner/pending
OwnerDashboard -> /owner
NeedMoreInfo -> quay ve step theo reason
```

FE khong tu quyet dinh user la Owner dua tren UI state.

FE chi tin:

```text
GET /api/auth/me
roles includes Owner
```

Sau khi submit approved:

```text
refresh token hoac login lai
```

## 9. Redis Lock

Can lock de tranh submit double:

```text
owner_application:submit_lock:{userId}
verification:submit_lock:{userId}:NationalId
verification:processing:{requestId}
```

TTL goi y:

```text
submit lock: 1-5 phut
processing lock: 10-30 phut
```

## 10. Mongo/Audit Log

Mongo khong la source of truth.

Nen log cac event:

```text
OwnerApplicationCreated
OwnerApplicationBankUpdated
NationalIdSubmitted
NationalIdVerified
NationalIdNeedMoreInfo
NationalIdRejected
OwnerApplicationSubmitted
OwnerApplicationApproved
OwnerApplicationRejected
OwnerRoleAssigned
```

Source of truth van la SQL:

```text
CustomerProfiles
VerificationRequests
OwnerApplications
OwnerProfiles
UserRoles
```

## 11. Suggested Implementation Phases

### Phase 1 - Contract va DTO

- Tao DTO request/response cho owner onboarding.
- Tao enum/string constants cho status/type.
- Chuan hoa `nextStep`.

Done khi:

- Compile pass.
- Swagger thay API contract.

### Phase 2 - Cloudinary service

- Upload image backend -> Cloudinary.
- Tra `public_id`.
- Tao signed URL cho staff xem anh.

Done khi:

- Upload front/back thanh cong.
- DB luu public id.

### Phase 3 - FPT.AI national id service

- Goi FPT.AI.
- Parse response.
- Map confidence/status.

Done khi:

- CCCD pass -> `CustomerProfiles.NationalIdVerified = true`.
- Fail/unclear -> `VerificationRequests.Status` dung.

### Phase 4 - Owner application core

- POST owner application.
- GET current application.
- PUT bank info.
- Submit auto approve.

Done khi:

- Customer become Owner thanh cong.
- User co role Customer + Owner.
- OwnerProfile verified.

### Phase 5 - Register owner direct

- POST owner-onboarding/register.
- Tao customer + owner application waiting email.
- Continue flow sau verify email.

Done khi:

- User moi di het flow owner duoc.

### Phase 6 - Admin/Staff

- Staff list/detail/review.
- Admin create owner.
- Signed URL CCCD cho staff.

Done khi:

- Staff approve/reject duoc.
- Audit log co event.

### Phase 7 - Frontend wizard

- `/become-owner`
- `/register-owner`
- `/staff/owner-applications`
- `/admin/owners/create`

Done khi:

- FE di dung theo `nextStep`.
- Refresh session sau approved.

## 12. Test Plan

Backend unit/integration:

- Register normal chi tao Customer.
- Owner direct register tao Customer + OwnerApplication, chua tao Owner role.
- Existing Customer tao OwnerApplication thanh cong.
- CCCD missing back image bi reject validation.
- CCCD pass FPT.AI update CustomerProfiles.
- Bank missing bi reject validation.
- Submit khi chua CCCD verified bi reject.
- Submit khi du CCCD + bank thi cap role Owner.
- OwnerProfiles.IsVerified = true sau approve.
- UserRoles co Customer + Owner.
- Duplicate owner application active bi reject.

Frontend:

- Customer become owner flow.
- User moi register owner flow.
- NeedMoreInfo quay ve upload CCCD.
- Approved refresh session va vao `/owner`.

Security:

- Frontend khong thay FPT.AI key.
- CCCD URL khong public vinh vien.
- Staff/Admin moi xem anh CCCD signed URL.
- Audit log approval/reject.

