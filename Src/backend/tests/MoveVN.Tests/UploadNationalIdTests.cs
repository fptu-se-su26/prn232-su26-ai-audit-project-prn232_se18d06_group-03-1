using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;
using MoveVN.Application.Modules.Owner.Services;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using MoveVN.Domain.Enums;

namespace MoveVN.Tests;

/// <summary>
/// Unit tests for Function8 (UploadNationalIdAsync, UC-3.5.1).
/// Maps 1-1 to UTCID01..UTCID13 in the test-case table.
/// External systems (AI, Cloudinary, Mongo log) are faked.
/// </summary>
public class UploadNationalIdTests
{
    private sealed class FakeUserContext : ICurrentUserContext
    {
        private readonly long? _userId;
        public FakeUserContext(long? userId) => _userId = userId;
        public long? UserId => _userId;
    }

    private sealed class FakeUserRepo : IUserRepository
    {
        public OwnerApplication? App;
        public CustomerProfile? Profile;
        public VerificationRequest? LatestRequest;
        public readonly Dictionary<string, CustomerProfile> ProfilesByHash = new();
        public readonly Dictionary<long, User> UsersById = new();
        public readonly List<VerificationRequest> AddedRequests = new();

        public Task<OwnerApplication?> GetLatestOwnerApplicationByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(App != null && App.UserId == userId ? App : null);

        public Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Profile);

        public Task<VerificationRequest?> GetLatestNationalIdVerificationByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(LatestRequest);

        public Task AddVerificationRequestAsync(VerificationRequest request, CancellationToken cancellationToken = default)
        {
            request.Id = AddedRequests.Count + 1;
            AddedRequests.Add(request);
            return Task.CompletedTask;
        }

        public void UpdateVerificationRequest(VerificationRequest request) { }
        public void UpdateOwnerApplication(OwnerApplication application) { }
        public void UpdateCustomerProfile(CustomerProfile profile) { }

        public Task<CustomerProfile?> GetByNationalIdHashAsync(string hash, CancellationToken cancellationToken = default)
            => Task.FromResult(ProfilesByHash.TryGetValue(hash, out var p) ? p : null);

        public Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(UsersById.TryGetValue(id, out var u) ? u : null);

        public Task<User?> GetByIdTrackedAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> ExistsByPhoneAsync(string phone, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddAsync(User user, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddCustomerProfileAsync(CustomerProfile profile, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddOwnerProfileAsync(OwnerProfile profile, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddStaffProfileAsync(StaffProfile profile, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<StaffProfile?> GetStaffProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void Update(User user) => throw new NotImplementedException();
        public Task<OwnerProfile?> GetOwnerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void UpdateOwnerProfile(OwnerProfile profile) => throw new NotImplementedException();
        public Task AddOwnerApplicationAsync(OwnerApplication application, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> HasActiveOwnerApplicationAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VerificationRequest?> GetVerificationRequestByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VerificationRequest>> GetVerificationRequestsByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<(List<NationalIdVerificationListItem> Items, int TotalCount)> GetNationalIdVerificationsPagedAsync(string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<NationalIdVerificationDetailDto?> GetNationalIdVerificationDetailAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<(List<MoveVN.Application.Modules.Admin.DTOs.AdminUserListItem> Items, int TotalCount)> GetAdminUserListAsync(string? keyword, string? sortBy, string? role, string? status, bool? isOnline, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerApplication?> GetOwnerApplicationByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StaffOwnerApplicationQueryResult>> GetOwnerApplicationsByFilterAsync(string? status, string? keyword, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerApplicationCurrentData?> GetOwnerApplicationCurrentDataAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<User>> GetUsersByRoleAsync(IEnumerable<string> roles, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<User>> GetAllActiveUsersAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<User>> GetUsersByIdsAsync(IEnumerable<long> ids, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class StubRoleRepo : IRoleRepository
    {
        public Task<Role?> GetByNameAsync(UserRoleType role, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<IList<string>> GetUserRoleNamesAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task RemoveUserRoleAsync(long userId, int roleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class StubRedisLock : IRedisLockService
    {
        public Task<RedisLock?> AcquireLockAsync(string lockKey, TimeSpan expiry, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task ReleaseLockAsync(RedisLock lockObj, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeCloudinary : ICloudinaryService
    {
        public Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
            => Task.FromResult(new CloudinaryUploadResult(publicId, "https://img/front.jpg", 100, 100, 10));
        public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60) => throw new NotImplementedException();
        public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeActivityLogger : IAuthActivityLogger
    {
        public Task LogAsync(long? userId, string? email, AuthEventType eventType, string? ipAddress, string? userAgent, string? sessionId = null, object? metadata = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeHasher : IPasswordHasherService
    {
        public string Hash(string value) => throw new NotImplementedException();
        public bool Verify(string hash, string value) => throw new NotImplementedException();
        public string Sha256(string value) => throw new NotImplementedException();
    }

    private sealed class FakeOtp : IOtpService
    {
        public Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<int> GetResendCountAsync(string email, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeNotif : INotificationService
    {
        public Task<PagedResult<MoveVN.Application.Modules.Notifications.DTOs.NotificationResponse>> GetMineAsync(bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MoveVN.Application.Modules.Notifications.DTOs.NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MoveVN.Application.Modules.Notifications.DTOs.NotificationResponse> MarkAsReadAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MoveVN.Application.Modules.Notifications.DTOs.MarkAllNotificationsReadResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MoveVN.Application.Modules.Notifications.DTOs.NotificationResponse> CreateAsync(MoveVN.Application.Modules.Notifications.DTOs.CreateNotificationRequest request, CancellationToken cancellationToken = default)
            => Task.FromResult(new MoveVN.Application.Modules.Notifications.DTOs.NotificationResponse());
        public Task<MoveVN.Application.Modules.Notifications.DTOs.BroadcastNotificationResponse> BroadcastAsync(MoveVN.Application.Modules.Notifications.DTOs.BroadcastNotificationRequest request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeAiClient : INationalIdVerificationClient
    {
        private readonly NationalIdPreVerifyResult? _result;
        private readonly Exception? _throw;
        public bool Called;
        public FakeAiClient(NationalIdPreVerifyResult? result, Exception? throwEx = null)
        {
            _result = result;
            _throw = throwEx;
        }
        public Task<NationalIdPreVerifyResult?> PreVerifyAsync(byte[] imageBytes, string fileName, CancellationToken cancellationToken = default)
        {
            Called = true;
            return _throw != null ? Task.FromException<NationalIdPreVerifyResult?>(_throw) : Task.FromResult(_result);
        }
    }

    private sealed class FakeNationalIdLog : INationalIdVerificationLogService
    {
        public Task LogAsync(NationalIdVerificationLogEntry entry, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeUow : IUnitOfWork
    {
        public void Dispose() { }
        public MoveVN.Application.Interfaces.IGenericRepository<T> Repository<T>() where T : MoveVN.Domain.Common.BaseEntity => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeEncryption : IEncryptionService
    {
        public string? Encrypt(string? plainText) => plainText;
        public string? Decrypt(string? cipherTextBase64) => cipherTextBase64;
    }

    private sealed class RecordingNationalIdLimiter : INationalIdUploadAttemptLimiter
    {
        public NationalIdUploadAttemptState PresetState = new();
        public int FailureCount;
        public int AcceptedCount;
        public Task<NationalIdUploadAttemptState> GetStateAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(PresetState);
        public Task RegisterFailureAsync(long userId, CancellationToken cancellationToken = default)
        {
            FailureCount++;
            return Task.CompletedTask;
        }
        public Task RegisterAcceptedAsync(long userId, CancellationToken cancellationToken = default)
        {
            AcceptedCount++;
            return Task.CompletedTask;
        }
    }

    private static string Sha256Hex(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static NationalIdPreVerifyResult PassResult(string nationalId) => new()
    {
        Success = true,
        Confidence = 0.97,
        NationalId = nationalId,
        FullName = "Nguyen Van A",
        Recommendation = "Pass",
        RawResponse = "{}",
    };

    private sealed class Harness
    {
        public readonly FakeUserRepo Repos = new();
        public readonly RecordingNationalIdLimiter Limiter = new();
        private readonly FakeAiClient _ai;
        public bool AiCalled => _ai.Called;
        public OwnerApplication App = new() { Id = 1, UserId = 1, Status = "WaitingCccdVerification" };
        public CustomerProfile Profile = new() { UserId = 1, NationalIdVerified = false };
        public OwnerApplicationService Service;

        public Harness(long? userId, NationalIdPreVerifyResult? aiResult, Exception? aiThrow = null)
        {
            _ai = new FakeAiClient(aiResult, aiThrow);
            Repos.App = App;
            Repos.Profile = Profile;
            Repos.UsersById[1] = new User { Id = 1, FullName = "Test User", Email = "t@t.com", Status = "Active" };
            Service = new OwnerApplicationService(
                new FakeUserContext(userId),
                Repos,
                new StubRoleRepo(),
                new StubRedisLock(),
                new FakeCloudinary(),
                new FakeActivityLogger(),
                new FakeHasher(),
                new FakeOtp(),
                new FakeNotif(),
                _ai,
                new FakeNationalIdLog(),
                Limiter,
                NullLogger<OwnerApplicationService>.Instance,
                new FakeUow(),
                new FakeEncryption());
        }

        public Task<NationalIdUploadResponse> Upload() => Service.UploadNationalIdAsync(new MemoryStream([1, 2, 3]), "front.jpg");
    }

    [Fact] // UTCID01
    public async Task NotLoggedIn_ThrowsUnauthorized()
    {
        var h = new Harness(null, PassResult("048209123456"));
        var act = () => h.Upload();
        Assert.Same(ErrorCode.UNAUTHORIZED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID02
    public async Task NoApplication_ThrowsNotFound()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.Repos.App = null;
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_APPLICATION_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID03
    public async Task TerminalApplication_ThrowsNotFound()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.App.Status = "Approved";
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_APPLICATION_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID04
    public async Task NoProfile_ThrowsUserNotFound()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.Repos.Profile = null;
        var act = () => h.Upload();
        Assert.Same(ErrorCode.USER_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID05
    public async Task PendingRequestExists_ThrowsProcessing()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.Repos.LatestRequest = new VerificationRequest { Id = 9, UserId = 1, Type = "NationalId", Status = "Pending" };
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_VERIFICATION_PROCESSING, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID06
    public async Task AiReturnsNull_ReturnsFailed()
    {
        var h = new Harness(1, null);
        var result = await h.Upload();
        result.Status.Should().Be("Failed");
        result.NationalIdVerified.Should().BeFalse();
        result.NextStep.Should().Be("UploadNationalId");
        h.Repos.AddedRequests.Should().ContainSingle().Which.Status.Should().Be("Failed");
    }

    [Fact] // UTCID07
    public async Task PassNewId_ReturnsVerified()
    {
        var h = new Harness(1, PassResult("048209123456"));
        var result = await h.Upload();
        result.Status.Should().Be("Verified");
        result.NationalIdVerified.Should().BeTrue();
        result.NextStep.Should().Be("BankInfo");
        h.Profile.NationalIdVerified.Should().BeTrue();
        h.Profile.NationalIdHash.Should().Be(Sha256Hex("048209123456"));
        h.App.Status.Should().Be("WaitingBankInfo");
    }

    [Fact] // UTCID08
    public async Task PassSameId_Reverifies()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.Profile.NationalIdVerified = true;
        h.Profile.NationalIdHash = Sha256Hex("048209123456");
        var result = await h.Upload();
        result.Status.Should().Be("Verified");
        result.NationalIdVerified.Should().BeTrue();
    }

    [Fact] // UTCID09
    public async Task PassOtherUsersId_ThrowsDuplicated()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.Repos.ProfilesByHash[Sha256Hex("048209123456")] = new CustomerProfile { UserId = 2, NationalIdVerified = true };
        h.Repos.UsersById[2] = new User { Id = 2, FullName = "Other", Email = "o@o.com", Status = "Active" };
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_NATIONAL_ID_DUPLICATED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
        h.Repos.AddedRequests.Should().ContainSingle().Which.Status.Should().Be("Failed");
    }

    [Fact] // UTCID10
    public async Task PassDifferentIdWhileVerified_ThrowsDuplicatedWithMessage()
    {
        var h = new Harness(1, PassResult("048209999999"));
        h.Profile.NationalIdVerified = true;
        h.Profile.NationalIdHash = Sha256Hex("048209123456");
        var act = () => h.Upload();
        var ex = await Assert.ThrowsAsync<AppException>(act);
        Assert.Same(ErrorCode.OWNER_NATIONAL_ID_DUPLICATED, ex.ErrorCode);
        ex.Errors.Should().ContainSingle().Which.Should().Contain("không thể thay đổi sang CCCD khác");
    }

    [Fact] // UTCID11
    public async Task ManualReview_ReturnsPending()
    {
        var h = new Harness(1, new NationalIdPreVerifyResult
        {
            Success = false, Confidence = 0.5, Recommendation = "ManualReview", RawResponse = "{}",
        });
        var result = await h.Upload();
        result.Status.Should().Be("Pending");
        result.NationalIdVerified.Should().BeFalse();
        h.Repos.AddedRequests.Should().ContainSingle().Which.Status.Should().Be("Pending");
    }

    [Fact] // UTCID12
    public async Task BadImage_ReturnsRejected()
    {
        var h = new Harness(1, new NationalIdPreVerifyResult
        {
            Success = false, Confidence = 0.2, Recommendation = "Reject", RawResponse = "{}",
        });
        var result = await h.Upload();
        result.Status.Should().Be("Rejected");
        result.NationalIdVerified.Should().BeFalse();
    }

    [Fact] // UTCID13
    public async Task AiThrows_ReturnsFailedAndThrows()
    {
        var h = new Harness(1, PassResult("048209123456"), new InvalidOperationException("boom"));
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_VERIFICATION_REQUEST_FAILED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
        h.Repos.AddedRequests.Should().ContainSingle().Which.Status.Should().Be("Failed");
    }

    private static NationalIdPreVerifyResult RejectResult() => new()
    {
        Success = false,
        Confidence = 0.3,
        Recommendation = "Reject",
        Flags = ["NATIONAL_MOTTO_NOT_FOUND"],
        RawResponse = "{}",
    };

    [Fact] // UTCID14 — genuine invalid AI result counts one failure
    public async Task RejectResult_RegistersFailure()
    {
        var h = new Harness(1, RejectResult());
        var result = await h.Upload();
        result.Status.Should().Be("Rejected");
        h.Limiter.FailureCount.Should().Be(1);
        h.Limiter.AcceptedCount.Should().Be(0);
        h.Repos.AddedRequests.Should().ContainSingle().Which.Status.Should().Be("Rejected");
    }

    [Fact] // UTCID15 — second consecutive invalid result increments again
    public async Task RejectTwice_RegistersFailureTwice()
    {
        var h = new Harness(1, RejectResult());
        await h.Upload();
        h.Repos.LatestRequest = null; // allow re-upload in-memory
        var second = await h.Upload();
        second.Status.Should().Be("Rejected");
        h.Limiter.FailureCount.Should().Be(2);
    }

    [Fact] // UTCID16 — locked limiter blocks before AI is called
    public async Task LockedLimiter_ThrowsLockedWithoutCallingAi()
    {
        var h = new Harness(1, RejectResult());
        h.Limiter.PresetState = new NationalIdUploadAttemptState { LockedUntil = DateTime.UtcNow.AddMinutes(30) };
        var act = () => h.Upload();
        var ex = await Assert.ThrowsAsync<AppException>(act);
        Assert.Same(ErrorCode.NATIONAL_ID_UPLOAD_LOCKED, ex.ErrorCode);
        ex.Errors.Should().ContainSingle().Which.Should().Contain("Vui lòng thử lại sau");
        h.AiCalled.Should().BeFalse();
        h.Limiter.FailureCount.Should().Be(0);
    }

    [Fact] // UTCID17 — Pending/ManualReview resets (accepted), not failure
    public async Task ManualReview_RegistersAccepted()
    {
        var h = new Harness(1, new NationalIdPreVerifyResult
        {
            Success = false, Confidence = 0.5, Recommendation = "ManualReview", RawResponse = "{}",
        });
        var result = await h.Upload();
        result.Status.Should().Be("Pending");
        h.Limiter.AcceptedCount.Should().Be(1);
        h.Limiter.FailureCount.Should().Be(0);
    }

    [Fact] // UTCID18 — success resets (accepted), not failure
    public async Task PassResult_RegistersAccepted()
    {
        var h = new Harness(1, PassResult("048209123456"));
        var result = await h.Upload();
        result.Status.Should().Be("Verified");
        h.Limiter.AcceptedCount.Should().Be(1);
        h.Limiter.FailureCount.Should().Be(0);
    }

    [Fact] // UTCID19 — AI timeout/exception counts nothing
    public async Task AiThrows_RegistersNothing()
    {
        var h = new Harness(1, PassResult("048209123456"), new TimeoutException("ai timeout"));
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_VERIFICATION_REQUEST_FAILED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
        h.Limiter.FailureCount.Should().Be(0);
        h.Limiter.AcceptedCount.Should().Be(0);
    }

    [Fact] // UTCID20 — AI unavailable (null result) counts nothing
    public async Task AiReturnsNull_RegistersNothing()
    {
        var h = new Harness(1, null);
        var result = await h.Upload();
        result.Status.Should().Be("Failed");
        h.Limiter.FailureCount.Should().Be(0);
        h.Limiter.AcceptedCount.Should().Be(0);
    }

    [Fact] // UTCID21 — duplicate CCCD counts nothing
    public async Task DuplicateId_RegistersNothing()
    {
        var h = new Harness(1, PassResult("048209123456"));
        h.Repos.ProfilesByHash[Sha256Hex("048209123456")] = new CustomerProfile { UserId = 2, NationalIdVerified = true };
        h.Repos.UsersById[2] = new User { Id = 2, FullName = "Other", Email = "o@o.com", Status = "Active" };
        var act = () => h.Upload();
        Assert.Same(ErrorCode.OWNER_NATIONAL_ID_DUPLICATED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
        h.Limiter.FailureCount.Should().Be(0);
        h.Limiter.AcceptedCount.Should().Be(0);
    }
}
