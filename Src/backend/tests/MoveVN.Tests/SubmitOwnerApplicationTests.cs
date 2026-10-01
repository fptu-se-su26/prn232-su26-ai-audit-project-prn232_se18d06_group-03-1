using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;
using MoveVN.Application.Modules.Owner.Services;
using MoveVN.Domain.Common;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Tests;

/// <summary>
/// Real execution of Function14 (OwnerApplicationService.SubmitApplicationAsync, UC-3.7.3).
/// UTCID01..UTCID14 map 1-1 to the designed matrix. No production code changed.
/// </summary>
public class SubmitOwnerApplicationTests
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
        public User? User;
        public CustomerProfile? Profile;
        public OwnerProfile? OwnerProfile;
        public OwnerProfile? AddedOwnerProfile;
        public OwnerProfile? UpdatedOwnerProfile;

        public Task<OwnerApplication?> GetLatestOwnerApplicationByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(App != null && App.UserId == userId ? App : null);

        public Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(User != null && User.Id == id ? User : null);

        public Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Profile);

        public Task<OwnerProfile?> GetOwnerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(OwnerProfile);

        public Task AddOwnerProfileAsync(OwnerProfile profile, CancellationToken cancellationToken = default)
        {
            AddedOwnerProfile = profile;
            return Task.CompletedTask;
        }

        public void UpdateOwnerProfile(OwnerProfile profile) => UpdatedOwnerProfile = profile;
        public void UpdateOwnerApplication(OwnerApplication application) { }
        public void UpdateCustomerProfile(CustomerProfile profile) { }

        public Task<User?> GetByIdTrackedAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> ExistsByPhoneAsync(string phone, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddAsync(User user, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddCustomerProfileAsync(CustomerProfile profile, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddStaffProfileAsync(StaffProfile profile, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<StaffProfile?> GetStaffProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void Update(User user) => throw new NotImplementedException();
        public Task<CustomerProfile?> GetByNationalIdHashAsync(string hash, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddOwnerApplicationAsync(OwnerApplication application, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> HasActiveOwnerApplicationAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddVerificationRequestAsync(VerificationRequest request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void UpdateVerificationRequest(VerificationRequest request) => throw new NotImplementedException();
        public Task<VerificationRequest?> GetVerificationRequestByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VerificationRequest?> GetLatestNationalIdVerificationByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VerificationRequest>> GetVerificationRequestsByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<(List<NationalIdVerificationListItem> Items, int TotalCount)> GetNationalIdVerificationsPagedAsync(string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<NationalIdVerificationDetailDto?> GetNationalIdVerificationDetailAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<(List<AdminUserListItem> Items, int TotalCount)> GetAdminUserListAsync(string? keyword, string? sortBy, string? role, string? status, bool? isOnline, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerApplication?> GetOwnerApplicationByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<StaffOwnerApplicationQueryResult>> GetOwnerApplicationsByFilterAsync(string? status, string? keyword, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerApplicationCurrentData?> GetOwnerApplicationCurrentDataAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<User>> GetUsersByRoleAsync(IEnumerable<string> roles, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<User>> GetAllActiveUsersAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<User>> GetUsersByIdsAsync(IEnumerable<long> ids, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeRoleRepo : IRoleRepository
    {
        public List<string> RoleNames = [];
        public Role? OwnerRole = new() { Id = 2, Name = "Owner" };
        public readonly List<UserRole> AddedRoles = [];
        public Task<IList<string>> GetUserRoleNamesAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IList<string>>(RoleNames);
        public Task<Role?> GetByNameAsync(UserRoleType role, CancellationToken cancellationToken = default)
            => Task.FromResult(OwnerRole);
        public Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default)
        {
            AddedRoles.Add(userRole);
            return Task.CompletedTask;
        }
        public Task RemoveUserRoleAsync(long userId, int roleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeRedisLock : IRedisLockService
    {
        private readonly bool _acquire;
        public FakeRedisLock(bool acquire = true) => _acquire = acquire;
        public Task<RedisLock?> AcquireLockAsync(string lockKey, TimeSpan expiry, CancellationToken cancellationToken = default)
            => Task.FromResult<RedisLock?>(_acquire ? new RedisLock(lockKey, "v", DateTime.UtcNow) : null);
        public Task ReleaseLockAsync(RedisLock lockObj, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeCloudinary : ICloudinaryService
    {
        public Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60) => throw new NotImplementedException();
        public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeActivityLogger : IAuthActivityLogger
    {
        public readonly List<AuthEventType> Events = [];
        public Task LogAsync(long? userId, string? email, AuthEventType eventType, string? ipAddress, string? userAgent, string? sessionId = null, object? metadata = null, CancellationToken cancellationToken = default)
        {
            Events.Add(eventType);
            return Task.CompletedTask;
        }
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
        public readonly List<CreateNotificationRequest> Sent = [];
        public Task<NotificationResponse> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
        {
            Sent.Add(request);
            return Task.FromResult(new NotificationResponse());
        }
        public Task<PagedResult<NotificationResponse>> GetMineAsync(bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<NotificationResponse> MarkAsReadAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MarkAllNotificationsReadResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<BroadcastNotificationResponse> BroadcastAsync(BroadcastNotificationRequest request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeAiClient : INationalIdVerificationClient
    {
        public Task<NationalIdPreVerifyResult?> PreVerifyAsync(byte[] imageBytes, string fileName, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private sealed class FakeNationalIdLog : INationalIdVerificationLogService
    {
        public Task LogAsync(NationalIdVerificationLogEntry entry, CancellationToken cancellationToken = default) => Task.CompletedTask;
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

    private sealed class FakeNationalIdLimiter : INationalIdUploadAttemptLimiter
    {
        public Task<NationalIdUploadAttemptState> GetStateAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(new NationalIdUploadAttemptState());
        public Task RegisterFailureAsync(long userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task RegisterAcceptedAsync(long userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class Harness
    {
        public readonly FakeUserRepo Repos = new();
        public readonly FakeRoleRepo Roles = new();
        public readonly FakeRedisLock Locks;
        public readonly FakeActivityLogger Activities = new();
        public readonly FakeNotif Notifications = new();
        public readonly OwnerApplicationService Service;

        public Harness(
            long? userId = 2,
            OwnerApplication? app = null,
            User? user = null,
            CustomerProfile? profile = null,
            OwnerProfile? ownerProfile = null,
            List<string>? roleNames = null,
            bool lockAcquired = true,
            bool ownerRoleExists = true)
        {
            Repos.App = app;
            Repos.User = user;
            Repos.Profile = profile;
            Repos.OwnerProfile = ownerProfile;
            Roles.RoleNames = roleNames ?? [];
            Roles.OwnerRole = ownerRoleExists ? new Role { Id = 2, Name = "Owner" } : null;
            Locks = new FakeRedisLock(lockAcquired);
            Service = new OwnerApplicationService(
                new FakeUserContext(userId),
                Repos,
                Roles,
                Locks,
                new FakeCloudinary(),
                Activities,
                new FakeHasher(),
                new FakeOtp(),
                Notifications,
                new FakeAiClient(),
                new FakeNationalIdLog(),
                new FakeNationalIdLimiter(),
                NullLogger<OwnerApplicationService>.Instance,
                new FakeUow(),
                new FakeEncryption());
        }

        public Task<SubmitOwnerApplicationResponse> Submit() => Service.SubmitApplicationAsync();
    }

    private static User ActiveUser() => new()
    {
        Id = 2, FullName = "Duy", Email = "d@t.com",
        Status = UserStatus.Active.ToString(), IsEmailVerified = true,
    };

    private static OwnerApplication ReadyApp() => new()
    {
        Id = 10, UserId = 2, Status = "ReadyToSubmit",
        BankName = "Vietcombank", BankAccountNumber = "3213134324", BankAccountHolderName = "DUY",
    };

    private static CustomerProfile VerifiedProfile() => new() { UserId = 2, NationalIdVerified = true };

    private static Harness ValidHarness(
        OwnerApplication? app = null,
        OwnerProfile? ownerProfile = null,
        bool lockAcquired = true,
        bool ownerRoleExists = true) => new(
            userId: 2,
            app: app ?? ReadyApp(),
            user: ActiveUser(),
            profile: VerifiedProfile(),
            ownerProfile: ownerProfile,
            lockAcquired: lockAcquired,
            ownerRoleExists: ownerRoleExists);

    [Fact] // UTCID01
    public async Task NotLoggedIn_ThrowsUnauthorized()
    {
        var h = new Harness(userId: null);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.UNAUTHORIZED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID02
    public async Task NoApplication_ThrowsNotFound()
    {
        var h = new Harness(userId: 2, app: null, user: ActiveUser(), profile: VerifiedProfile());
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_APPLICATION_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID03
    public async Task NoUser_ThrowsUserNotFound()
    {
        // UTCID03 requires an application so execution reaches user lookup (User ID = 10000).
        var h = new Harness(userId: 10000,
            app: new OwnerApplication { Id = 11, UserId = 10000, Status = "ReadyToSubmit" },
            user: null, profile: VerifiedProfile());
        var act = () => h.Submit();
        Assert.Same(ErrorCode.USER_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID04
    public async Task AlreadyOwner_Suspended_ThrowsAlreadyOwner_First()
    {
        // Proves owner-role check runs BEFORE user-status check.
        var user = ActiveUser();
        user.Status = UserStatus.Suspended.ToString();
        var h = new Harness(userId: 2, app: ReadyApp(), user: user, profile: VerifiedProfile(),
            roleNames: ["Owner"]);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_ALREADY_OWNER, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID05
    public async Task SuspendedNotOwner_ThrowsUserNotActive()
    {
        var user = ActiveUser();
        user.Status = UserStatus.Suspended.ToString();
        var h = new Harness(userId: 2, app: ReadyApp(), user: user, profile: VerifiedProfile());
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_USER_NOT_ACTIVE, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID06
    public async Task EmailNotVerified_ThrowsEmailNotVerified()
    {
        var user = ActiveUser();
        user.IsEmailVerified = false;
        var h = new Harness(userId: 2, app: ReadyApp(), user: user, profile: VerifiedProfile());
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_EMAIL_NOT_VERIFIED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID07
    public async Task ProfileNull_ThrowsCccdNotVerified()
    {
        var h = new Harness(userId: 2, app: ReadyApp(), user: ActiveUser(), profile: null);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_CCCD_NOT_VERIFIED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID08
    public async Task ProfileUnverified_ThrowsCccdNotVerified()
    {
        var h = new Harness(userId: 2, app: ReadyApp(), user: ActiveUser(),
            profile: new CustomerProfile { UserId = 2, NationalIdVerified = false });
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_CCCD_NOT_VERIFIED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID09
    public async Task BankNumberNull_ThrowsBankInfoMissing()
    {
        var app = ReadyApp();
        app.BankAccountNumber = null;
        var h = new Harness(userId: 2, app: app, user: ActiveUser(), profile: VerifiedProfile());
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_BANK_INFO_MISSING, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID10
    public async Task StatusNotReady_ThrowsNotReady()
    {
        var app = ReadyApp();
        app.Status = "WaitingBankInfo";
        var h = new Harness(userId: 2, app: app, user: ActiveUser(), profile: VerifiedProfile());
        var act = () => h.Submit();
        Assert.Same(ErrorCode.OWNER_NOT_READY_TO_SUBMIT, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID11
    public async Task LockFail_ThrowsRedisLockFailed()
    {
        var h = ValidHarness(lockAcquired: false);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.REDIS_LOCK_FAILED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID12
    public async Task OwnerRoleMissing_ThrowsInvalidRole()
    {
        var h = ValidHarness(ownerRoleExists: false);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.INVALID_ROLE, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID13
    public async Task ValidNewProfile_InsertsAndReturnsApproved()
    {
        var h = ValidHarness();
        var result = await h.Submit();
        result.Status.Should().Be("Approved");
        result.IsOwner.Should().BeTrue();
        result.RequiresTokenRefresh.Should().BeTrue();
        result.NextStep.Should().Be("OwnerDashboard");
        h.Repos.App!.Status.Should().Be("Approved");
        h.Repos.App.SubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
        h.Repos.App.ApprovedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
        h.Repos.AddedOwnerProfile.Should().NotBeNull();
        var added = h.Repos.AddedOwnerProfile!;
        added.UserId.Should().Be(2);
        added.BankName.Should().Be("Vietcombank");
        added.IsVerified.Should().BeTrue();
        h.Roles.AddedRoles.Should().ContainSingle().Which.Should().Match<UserRole>(r => r.UserId == 2 && r.RoleId == 2);
        h.Activities.Events.Should().Equal(AuthEventType.OwnerApplicationSubmitted, AuthEventType.OwnerRoleAssigned);
        h.Notifications.Sent.Should().ContainSingle().Which.Type.Should().Be("OwnerApplication");
    }

    [Fact] // UTCID14
    public async Task ValidExistingProfile_UpdatesAndReturnsApproved()
    {
        var existing = new OwnerProfile
        {
            UserId = 2, BankName = "OldBank", BankAccountNumber = "000",
            BankAccountHolderName = "OLD", IsVerified = false,
        };
        var h = ValidHarness(ownerProfile: existing);
        var result = await h.Submit();
        result.Status.Should().Be("Approved");
        result.IsOwner.Should().BeTrue();
        result.RequiresTokenRefresh.Should().BeTrue();
        result.NextStep.Should().Be("OwnerDashboard");
        h.Repos.AddedOwnerProfile.Should().BeNull();
        h.Repos.UpdatedOwnerProfile.Should().NotBeNull();
        var updated = h.Repos.UpdatedOwnerProfile!;
        updated.BankName.Should().Be("Vietcombank");
        updated.BankAccountNumber.Should().Be("3213134324");
        updated.IsVerified.Should().BeTrue();
        updated.VerifiedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
        h.Roles.AddedRoles.Should().ContainSingle();
        h.Activities.Events.Should().Equal(AuthEventType.OwnerApplicationSubmitted, AuthEventType.OwnerRoleAssigned);
        h.Notifications.Sent.Should().ContainSingle();
    }
}
