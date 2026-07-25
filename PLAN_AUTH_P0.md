# Kế Hoạch Triển Khai P0 Auth Fixes

> **Ngày**: 2026-07-25
> **Scope**: 4 P0 items — giữ nguyên core logic, chỉ fix/mở rộng những chỗ thiếu

---

## P0-1: Fix Google Login Flow (Naming Fix)

### Vấn đề
- Frontend dùng `useGoogleLogin` từ `@react-oauth/google` → trả về **OAuth2 access token**
- Frontend đặt tên biến là `idToken` nhưng thực chất là `access_token` → gây nhầm lẫn
- Backend nhận field `IdToken` rồi dùng làm `access_token` trong Google userinfo URL → hoạt động đúng nhưng naming sai
- **Rủi ro**: Maintenance hazard, developer dễ refactor sai trong tương lai

### Giải pháp: Đổi tên cho đúng bản chất

#### Backend

**1. `GoogleLoginRequest.cs`** — Đổi tên field
```csharp
// Trước
public string IdToken { get; set; } = string.Empty;

// Sau
public string AccessToken { get; set; } = string.Empty;
```

**2. `AuthService.cs:158-159`** — Sửa `GoogleLoginAsync`
```csharp
// Trước
$"...access_token={request.IdToken}"

// Sau
$"...access_token={request.AccessToken}"
```

**3. `GoogleLoginRequestValidator.cs`** — Update field name
```csharp
RuleFor(x => x.AccessToken).NotEmpty();
```

#### Frontend

**4. `LoginPage.tsx:39-40`** — Đổi tên biến
```tsx
// Trước
const idToken = tokenResponse.access_token;
const result = await googleLogin(idToken);

// Sau
const accessToken = tokenResponse.access_token;
const result = await googleLogin(accessToken);
```

**5. `authService.ts:95-98`** — Đổi tên param + payload key
```ts
// Trước
export async function googleLogin(idToken: string) {
  const res = await apiClient.post(..., { idToken });

// Sau
export async function googleLogin(accessToken: string) {
  const res = await apiClient.post(..., { accessToken });
```

### Files thay đổi
| File | Thay đổi |
|------|----------|
| `MoveVN.Application/.../DTOs/GoogleLoginRequest.cs` | `IdToken` → `AccessToken` |
| `MoveVN.Application/.../Validators/GoogleLoginRequestValidator.cs` | Update field name |
| `MoveVN.Application/.../Services/AuthService.cs:158` | `request.IdToken` → `request.AccessToken` |
| `FrontEnd/src/pages/auth/LoginPage.tsx:39-40` | `idToken` → `accessToken` |
| `FrontEnd/src/features/auth/services/authService.ts:95-98` | Param name + payload key |

---

## P0-2: Rate Limiting cho Auth Endpoints

### Vấn đề
- Login, register, forgot-password, OTP endpoints **không có rate limiting**
- Bị brute force login, credential stuffing, spam OTP rất dễ

### Giải pháp: Dùng `AddFixedWindowLimiter` (In-Memory, đã có sẵn)
- Không dùng Redis (Upstash REST) vì adds ~50-100ms latency cho mỗi request
- In-Memory đủ cho single-server deployment
- `admin-reset-password` **bỏ qua** — đã có `[Authorize(Roles = "Admin")]`

### Rate limit table

| Endpoint | PermitLimit | Window | Ý nghĩa |
|----------|-------------|--------|----------|
| `login` | 5 | 1 phút | Chống brute force password |
| `register` | 3 | 5 phút | Chống spam account |
| `forgot-password` | 3 | 5 phút | Chống spam OTP email |
| `reset-password` | 3 | 5 phút | Chống brute force OTP |
| `verify-otp` | 5 | 2 phút | Chống brute force OTP 6 số |
| `resend-otp` | 3 | 5 phút | Chống spam OTP email |
| `change-password` | 5 | 1 phút | Chống brute force password cũ |
| `refresh-token` | 10 | 1 phút | Cho phép auto-refresh bình thường |

#### Backend

**1. `Program.cs`** — Thêm 8 rate limit policies trong `AddRateLimiter`
```csharp
options.AddFixedWindowLimiter("AuthLogin", config =>
{
    config.PermitLimit = 5;
    config.Window = TimeSpan.FromMinutes(1);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthRegister", config =>
{
    config.PermitLimit = 3;
    config.Window = TimeSpan.FromMinutes(5);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthForgotPassword", config =>
{
    config.PermitLimit = 3;
    config.Window = TimeSpan.FromMinutes(5);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthResetPassword", config =>
{
    config.PermitLimit = 3;
    config.Window = TimeSpan.FromMinutes(5);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthVerifyOtp", config =>
{
    config.PermitLimit = 5;
    config.Window = TimeSpan.FromMinutes(2);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthResendOtp", config =>
{
    config.PermitLimit = 3;
    config.Window = TimeSpan.FromMinutes(5);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthChangePassword", config =>
{
    config.PermitLimit = 5;
    config.Window = TimeSpan.FromMinutes(1);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});

options.AddFixedWindowLimiter("AuthRefresh", config =>
{
    config.PermitLimit = 10;
    config.Window = TimeSpan.FromMinutes(1);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 0;
});
```

**2. `AuthController.cs`** — Thêm `[EnableRateLimiting]` vào 8 endpoints
```csharp
[HttpPost("login")]
[EnableRateLimiting("AuthLogin")]
public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(...)

[HttpPost("register")]
[EnableRateLimiting("AuthRegister")]
public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(...)

[HttpPost("forgot-password")]
[EnableRateLimiting("AuthForgotPassword")]
public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(...)

[HttpPost("reset-password")]
[EnableRateLimiting("AuthResetPassword")]
public async Task<ActionResult<ApiResponse<object>>> ResetPassword(...)

[HttpPost("verify-otp")]
[EnableRateLimiting("AuthVerifyOtp")]
public async Task<ActionResult<ApiResponse<object>>> VerifyOtp(...)

[HttpPost("resend-otp")]
[EnableRateLimiting("AuthResendOtp")]
public async Task<ActionResult<ApiResponse<object>>> ResendOtp(...)

[HttpPost("change-password")]
[EnableRateLimiting("AuthChangePassword")]
public async Task<ActionResult<ApiResponse<object>>> ChangePassword(...)

[HttpPost("refresh-token")]
[EnableRateLimiting("AuthRefresh")]
public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken(...)
```

### Files thay đổi
| File | Thay đổi |
|------|----------|
| `MoveVN.Api/Program.cs` | Thêm 8 rate limit policies |
| `MoveVN.Api/Controllers/AuthController.cs` | Thêm `[EnableRateLimiting]` vào 8 endpoints |

---

## P0-3: OTP Security Improvements

### 3A: OTP Verify Lockout (5 lần sai → khóa)

#### Vấn đề
- `OtpCode.Attempts` (byte) được increment nhưng **không bao giờ check limit**
- OTP 6 số = 1M combinations → attacker brute force thoải mái

#### Giải pháp: Check `MaxOtpAttempts = 5` trong `VerifyOtpAsync`

**1. `ErrorCode.cs`** — Thêm error code mới
```csharp
public static readonly ErrorCode OTP_LOCKED = new(
    "AUTH_1014",
    "OTP đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
    HttpStatusCode.TooManyRequests);
```

**2. `OtpService.cs`** — Thêm constant + check lockout
```csharp
private const int MaxOtpAttempts = 5;

public async Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default)
{
    var otpCode = await _otpCodeRepository.GetLatestAsync(email, purpose, cancellationToken)
        ?? throw new AppException(ErrorCode.OTP_FAIL);

    if (otpCode.IsUsed)
    {
        throw new AppException(ErrorCode.OTP_ALREADY_USED);
    }

    // THÊM: Check lockout
    if (otpCode.Attempts >= MaxOtpAttempts)
    {
        throw new AppException(ErrorCode.OTP_LOCKED);
    }

    if (otpCode.ExpiresAt <= DateTime.UtcNow || !_passwordHasherService.Verify(otpCode.OtpCodeHash, otp))
    {
        otpCode.Attempts++;
        _otpCodeRepository.Update(otpCode);
        throw new AppException(ErrorCode.OTP_FAIL);
    }

    otpCode.IsUsed = true;
    otpCode.UsedAt = DateTime.UtcNow;
    _otpCodeRepository.Update(otpCode);
}
```

**3. `FrontEnd/src/features/auth/utils/authErrors.ts`** — Thêm message
```ts
AUTH_1014: "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.",
```

#### Files thay đổi
| File | Thay đổi |
|------|----------|
| `MoveVN.Application/.../ErrorCode.cs` | Thêm `OTP_LOCKED` |
| `MoveVN.Infrastructure/.../OtpService.cs` | Thêm check `MaxOtpAttempts` |
| `FrontEnd/.../authErrors.ts` | Thêm message `AUTH_1014` |

---

### 3B: OTP Resend Daily Limit (5 lần/ngày, đếm chung tất cả purpose)

#### Vấn đề
- Attacker có thể spam `resend-otp` liên tục → flood email OTP
- Không có giới hạn số lần gửi OTP mỗi ngày

#### Giải pháp: Dùng Redis (Upstash REST) đếm chung Register + ForgotPassword + VerifyEmail
- **Lý do dùng Redis**: Counter cần survive server restart
- **Lý do đếm chung**: Tránh attacker spam cả 3 endpoint → 15 email/ngày
- **Key Redis**: `otp_resend:{email}:{date}` (bỏ purpose để đếm chung)

**1. `RedisKeys.cs`** — Thêm key mới
```csharp
public static string OtpResendDaily(string email, string date)
    => $"otp_resend:{email.ToLowerInvariant()}:{date}";
```

**2. `IOtpService.cs`** — Thêm method mới
```csharp
public interface IOtpService
{
    Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default);
    Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default);
    // THÊM
    Task<int> GetResendCountAsync(string email, CancellationToken cancellationToken = default);
}
```

**3. `OtpService.cs`** — Triển khai + inject `IHttpClientFactory`

```csharp
private const int MaxResendPerDay = 5;

private readonly IHttpClientFactory _httpClientFactory;
private readonly IConfiguration _configuration;

public OtpService(
    IOtpCodeRepository otpCodeRepository,
    IPasswordHasherService passwordHasherService,
    IEmailSender emailSender,
    IHttpClientFactory httpClientFactory,   // THÊM
    IConfiguration configuration)           // THÊM
{
    _otpCodeRepository = otpCodeRepository;
    _passwordHasherService = passwordHasherService;
    _emailSender = emailSender;
    _httpClientFactory = httpClientFactory; // THÊM
    _configuration = configuration;         // THÊM
}

public async Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default)
{
    // THÊM: Check daily limit
    var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
    var redisKey = RedisKeys.OtpResendDaily(email, today);

    var isConfigured = !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_URL"])
        && !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_TOKEN"]);

    if (isConfigured)
    {
        var count = await IncrementRedisAsync(redisKey, cancellationToken);
        if (count == 1)
        {
            var ttl = DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow;
            await SetRedisExpiryAsync(redisKey, (int)ttl.TotalSeconds, cancellationToken);
        }
        if (count > MaxResendPerDay)
        {
            throw new AppException(ErrorCode.OTP_RATE_LIMITED);
        }
    }

    // Tạo OTP như bình thường...
    var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    // ...
}

public async Task<int> GetResendCountAsync(string email, CancellationToken cancellationToken = default)
{
    var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
    var redisKey = RedisKeys.OtpResendDaily(email, today);
    return await GetRedisValueAsync(redisKey, cancellationToken);
}

// THÊM: Redis helper methods (copy pattern từ RedisTokenSessionService)
private async Task<int> IncrementRedisAsync(string key, CancellationToken cancellationToken)
{
    var result = await SendRedisCommandAsync(["INCR", key], cancellationToken);
    return result.ValueKind == JsonValueKind.Number ? result.GetInt32() : 0;
}

private async Task SetRedisExpiryAsync(string key, int ttlSeconds, CancellationToken cancellationToken)
{
    await SendRedisCommandAsync(["EXPIRE", key, ttlSeconds.ToString()], cancellationToken);
}

private async Task<int> GetRedisValueAsync(string key, CancellationToken cancellationToken)
{
    var result = await SendRedisCommandAsync(["GET", key], cancellationToken);
    if (result.ValueKind == JsonValueKind.Number) return result.GetInt32();
    if (result.ValueKind == JsonValueKind.String && int.TryParse(result.GetString(), out var val)) return val;
    return 0;
}

private async Task<JsonElement> SendRedisCommandAsync(object[] command, CancellationToken cancellationToken)
{
    var restUrl = _configuration["UPSTASH_REDIS_REST_URL"]
        ?? throw new InvalidOperationException("UPSTASH_REDIS_REST_URL is not configured.");
    var restToken = _configuration["UPSTASH_REDIS_REST_TOKEN"]
        ?? throw new InvalidOperationException("UPSTASH_REDIS_REST_TOKEN is not configured.");

    var client = _httpClientFactory.CreateClient("UpstashRedis");
    using var request = new HttpRequestMessage(HttpMethod.Post, restUrl.TrimEnd('/'))
    {
        Content = JsonContent.Create(command)
    };
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", restToken);

    using var response = await client.SendAsync(request, cancellationToken);
    response.EnsureSuccessStatusCode();

    using var payload = await JsonDocument.ParseAsync(
        await response.Content.ReadAsStreamAsync(cancellationToken),
        cancellationToken: cancellationToken);

    if (!payload.RootElement.TryGetProperty("result", out var result))
    {
        throw new JsonException("Upstash Redis response does not contain a result.");
    }

    return result.Clone();
}
```

**4. `ServiceCollectionExtensions.cs`** — Không thay đổi
- `services.AddHttpClient("UpstashRedis", ...)` đã có sẵn (dùng chung với `RedisTokenSessionService`)
- `services.AddScoped<IOtpService, OtpService>()` đã có sẵn

#### Files thay đổi
| File | Thay đổi |
|------|----------|
| `MoveVN.Infrastructure/Caching/RedisKeys.cs` | Thêm `OtpResendDaily` |
| `MoveVN.Application/.../Interfaces/IOtpService.cs` | Thêm `GetResendCountAsync` |
| `MoveVN.Infrastructure/.../OtpService.cs` | Inject deps + check daily limit + Redis helpers |

---

## P0-4: Revoke All Sessions khi Reset/Change Password

### Vấn đề
- Sau `ResetPassword` và `ChangePassword`, tất cả refresh token cũ **vẫn active**
- Attacker có token vẫn login được dù user đã đổi password

### Giải pháp: Thêm `RevokeAllByUserIdAsync` trong `IRefreshTokenService`

#### Backend

**1. `IRefreshTokenService.cs`** — Thêm method mới
```csharp
Task RevokeAllByUserIdAsync(long userId, CancellationToken cancellationToken = default);
```

**2. `IRefreshTokenRepository.cs`** — Thêm method mới
```csharp
Task<IReadOnlyList<RefreshToken>> GetActiveByUserIdAsync(long userId, CancellationToken cancellationToken = default);
```

**3. `RefreshTokenRepository.cs`** — Triển khai
```csharp
public async Task<IReadOnlyList<RefreshToken>> GetActiveByUserIdAsync(long userId, CancellationToken cancellationToken = default)
{
    var now = DateTime.UtcNow;
    return await _context.RefreshTokens
        .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > now)
        .ToListAsync(cancellationToken);
}
```

**4. `RefreshTokenService.cs`** — Triển khai + inject `ITokenSessionService`

```csharp
private readonly ITokenSessionService _tokenSessionService;

public RefreshTokenService(
    IRefreshTokenRepository refreshTokenRepository,
    IPasswordHasherService passwordHasherService,
    ITokenSessionService tokenSessionService) // THÊM
{
    _refreshTokenRepository = refreshTokenRepository;
    _passwordHasherService = passwordHasherService;
    _tokenSessionService = tokenSessionService; // THÊM
}

public async Task RevokeAllByUserIdAsync(long userId, CancellationToken cancellationToken = default)
{
    var now = DateTime.UtcNow;
    var tokens = await _refreshTokenRepository.GetActiveByUserIdAsync(userId, cancellationToken);

    foreach (var token in tokens)
    {
        token.RevokedAt = now;
        _refreshTokenRepository.Update(token);

        if (!string.IsNullOrWhiteSpace(token.AccessTokenJti))
        {
            await _tokenSessionService.RevokeAsync(token.AccessTokenJti, cancellationToken);
        }
    }
}
```

**5. `AuthService.cs`** — Gọi `RevokeAllByUserIdAsync` trong 2 method

```csharp
// Trong ResetPasswordAsync (sau line 315)
user.PasswordHash = _passwordHasherService.Hash(request.NewPassword);
user.UpdatedAt = DateTime.UtcNow;
_userRepository.Update(user);
await _refreshTokenService.RevokeAllByUserIdAsync(user.Id, cancellationToken); // THÊM
await _unitOfWork.SaveChangesAsync(cancellationToken);

// Trong ChangePasswordAsync (sau line 340)
user.PasswordHash = _passwordHasherService.Hash(request.NewPassword);
user.UpdatedAt = DateTime.UtcNow;
_userRepository.Update(user);
await _refreshTokenService.RevokeAllByUserIdAsync(user.Id, cancellationToken); // THÊM
await _unitOfWork.SaveChangesAsync(cancellationToken);
```

### Files thay đổi
| File | Thay đổi |
|------|----------|
| `MoveVN.Application/.../Interfaces/IRefreshTokenService.cs` | Thêm `RevokeAllByUserIdAsync` |
| `MoveVN.Infrastructure/.../RefreshTokenService.cs` | Triển khai + inject `ITokenSessionService` + revoke JTI |
| `MoveVN.Application/.../Interfaces/IRefreshTokenRepository.cs` | Thêm `GetActiveByUserIdAsync` |
| `MoveVN.Infrastructure/.../RefreshTokenRepository.cs` | Triển khai query |
| `MoveVN.Application/.../Services/AuthService.cs` | Gọi revoke trong `ResetPasswordAsync` + `ChangePasswordAsync` |

---

## Tóm Tắt Thứ Tự Triển Khai

| Bước | P0 | File sửa | Effort |
|------|----|---------|--------|
| 1 | P0-4 | `IRefreshTokenRepository` + `RefreshTokenRepository` + `IRefreshTokenService` + `RefreshTokenService` + `AuthService` | 30 min |
| 2 | P0-3A | `OtpService` + `ErrorCode` + `authErrors.ts` | 15 min |
| 3 | P0-3B | `RedisKeys` + `IOtpService` + `OtpService` | 30 min |
| 4 | P0-2 | `Program.cs` + `AuthController.cs` | 20 min |
| 5 | P0-1 | `GoogleLoginRequest` + `Validator` + `AuthService` + `LoginPage.tsx` + `authService.ts` | 20 min |
| 6 | Verify | Build backend + frontend, chạy lint | 10 min |

**Tổng estimated**: ~125 phút

---

## Lưu Ý

- **Không thay đổi DB schema**: `OtpCode.Attempts` đã là `byte`, `RefreshToken` đã có `RevokedAt` và `AccessTokenJti`
- **Không thay đổi flow hiện tại**: Chỉ thêm check/lockout/revoke vào đúng chỗ cần thiết
- **DI registrations**: Đã đúng trong `ServiceCollectionExtensions.cs`, không cần sửa
- **Redis client**: Dùng chung `HttpClient` name `"UpstashRedis"` với `RedisTokenSessionService`
- **Frontend types**: Không cần sửa `types.ts` vì cấu trúc response không đổi
