# Xác Thực MoveVN

## Vai Trò

Khi API khởi động, hệ thống sẽ tự động seed các role sau:

- `Admin`
- `Owner`
- `Customer`
- `Staff`

`Admin` được tạo từ biến môi trường. `Staff` chỉ có thể được tạo bởi tài khoản `Admin` đã đăng nhập. API đăng ký công khai chỉ chấp nhận `Customer` và `Owner`.

## Cấu Hình Môi Trường

JWT:

```env
JWT_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
JWT_EXPIRE_MINUTES=60
```

Tài khoản admin mặc định:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_FULL_NAME=System Admin
```

SMTP dùng để gửi OTP thật qua email:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=MoveVN
SMTP_ENABLE_SSL=true
```

Redis dùng để lưu session tạm thời của access token:

```env
REDIS_CONNECTION=
```

## Response Wrapper

Tất cả API thành công trả về dạng:

```json
{
  "status": true,
  "code": "200",
  "message": "Success.",
  "data": {}
}
```

Khi có lỗi:

```json
{
  "status": false,
  "code": "AUTH_1011",
  "message": "OTP is invalid or expired.",
  "data": null,
  "errors": []
}
```

Lỗi chung dùng mã số trực tiếp như `400`, `401`, `404`, `422`, `500`. Lỗi nghiệp vụ dùng nhóm rõ ràng như `AUTH_1011`, `ADMIN_2001`.

## Error Code

Tất cả lỗi được định nghĩa tập trung trong `ErrorCode`. Khi code service, không hard-code mã lỗi và message riêng lẻ.

Ví dụ:

```csharp
throw new AppException(ErrorCode.OTP_FAIL);
```

Kết quả trả về:

```json
{
  "status": false,
  "code": "AUTH_1011",
  "message": "OTP is invalid or expired."
}
```

Nghĩa là người code chỉ cần nhìn `OTP_FAIL`, còn hệ thống tự biết mã lỗi là `AUTH_1011`, message là `OTP is invalid or expired.`, HTTP status là `400 BadRequest`.

## Luồng OTP

OTP được lưu trong PostgreSQL bảng `OtpCodes`.

- OTP được hash trước khi lưu.
- OTP có hiệu lực 10 phút.
- Sau 10 phút, client phải gọi resend OTP để nhận mã mới.
- OTP được gửi qua SMTP bằng các biến môi trường `SMTP_*`.

Luồng đăng ký:

1. Gọi `POST /api/auth/register`.
2. Hệ thống tạo user với status `Pending` và email chưa verify.
3. Hệ thống sinh OTP, hash OTP, lưu vào DB và gửi email.
4. Gọi `POST /api/auth/verify-otp`.
5. Nếu OTP đúng, user chuyển sang `Active` và `IsEmailVerified = true`.
6. User có thể đăng nhập.

## Luồng Token

Access token:

- Là JWT.
- Có thời gian sống ngắn.
- Được trả về cho client sau khi login hoặc refresh.
- Được lưu tạm trong Redis theo `jti` của JWT.
- TTL trong Redis bằng thời gian hết hạn của access token.

Refresh token:

- Là token random bảo mật.
- Plain token chỉ trả về cho client một lần.
- Backend chỉ lưu SHA-256 hash trong PostgreSQL bảng `RefreshTokens`.
- Dùng để cấp access token mới.

## Vì Sao Cần Redis Session

JWT bình thường là stateless. Nếu token đã được ký hợp lệ và chưa hết hạn, backend sẽ chấp nhận token đó. Redis session thêm một lớp kiểm soát phía server:

- API có thể từ chối token nếu `jti` không còn trong Redis.
- Access token tự hết hiệu lực trên Redis bằng TTL.
- Sau này có thể làm logout tất cả thiết bị, revoke bắt buộc, khóa session đáng ngờ bằng cách xóa key Redis.
- Key session có dạng `session:{jti}`.

Nếu Redis không được cấu hình, hệ thống fallback về validate JWT bình thường.

## Endpoints

Public:

```text
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Cần đăng nhập:

```text
GET  /api/auth/me
POST /api/auth/change-password
GET  /api/users/me
PUT  /api/users/me/profile
```

Chỉ Admin:

```text
POST /api/admin/staff
```

## Lưu Trữ Dữ Liệu

PostgreSQL:

- `Users`
- `Roles`
- `UserRoles`
- `OtpCodes`
- `RefreshTokens`
- `CustomerProfiles`
- `OwnerProfiles`
- `StaffProfiles`

Redis:

- Session access token theo JWT `jti`
- Các key rate limit OTP/login trong tương lai

MongoDB:

- Log hoạt động auth trong collection `user_activity_logs` nếu MongoDB được cấu hình.

## Collection `user_activity_logs`

Collection này đã có trong code.

Các thành phần liên quan:

- Document: `UserActivityLogDocument`
- Mongo context: `MongoDbContext.UserActivityLogs`
- Index TTL: `MongoIndexInitializer`
- Logger: `AuthActivityLogger`

Mục đích của `user_activity_logs` là lưu lịch sử hành vi liên quan đến xác thực, ví dụ:

- User yêu cầu đăng ký.
- User verify OTP thành công.
- User login thành công.
- User login thất bại.
- User yêu cầu reset password.
- User reset password thành công.
- User đổi mật khẩu.
- Admin tạo Staff.

Dữ liệu này không dùng để xác thực chính. Nó chỉ phục vụ audit, bảo mật, điều tra sự cố và phân tích hành vi. Vì đây là log dạng append-only, nhiều bản ghi, không cần transaction chặt như token/password/role nên để trong MongoDB là hợp lý.

Ví dụ document:

```json
{
  "userId": "123",
  "event": "LoginSucceeded",
  "ipAddress": "127.0.0.1",
  "deviceType": "Mozilla/5.0 ...",
  "properties": {
    "email": "user@example.com"
  },
  "timestamp": "2026-06-09T10:00:00Z"
}
```

## Kiểm Tra Redis

Redis local của dự án chạy bằng Docker container:

```text
movevn-redis
```

Kiểm tra Redis đang hoạt động:

```powershell
docker exec movevn-redis redis-cli PING
```

Kết quả đúng:

```text
PONG
```

Liệt kê các access-token session:

```powershell
docker exec movevn-redis redis-cli --scan --pattern "session:*"
```

Kiểm tra thời gian sống còn lại của một session:

```powershell
docker exec movevn-redis redis-cli TTL "session:<jti>"
```

Xem metadata của session:

```powershell
docker exec movevn-redis redis-cli GET "session:<jti>"
```

Session hiện lưu các trường:

- `Jti`
- `UserId`
- `Email`
- `Roles`
- `ExpiresAt`
- `CreatedAt`

Backend không lưu nguyên access token trong Redis.

Xóa một session để revoke access token:

```powershell
docker exec movevn-redis redis-cli DEL "session:<jti>"
```

Xem tổng số key trong Redis:

```powershell
docker exec movevn-redis redis-cli DBSIZE
```

Kiểm tra trạng thái container:

```powershell
docker ps --filter "name=movevn-redis"
```

## Ghi Chú Bảo Mật

- Không lưu plain password.
- Không lưu plain OTP.
- Không lưu plain refresh token trong DB.
- Access token chỉ nên sống ngắn.
- Refresh token nên được lưu an toàn phía client.
- `Admin` không được public register.
- `Staff` chỉ được tạo bởi `Admin`.
