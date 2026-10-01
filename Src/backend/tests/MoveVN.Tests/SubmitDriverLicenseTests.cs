using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using MoveVN.Api.Controllers;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Services;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Common;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Repositories;

namespace MoveVN.Tests;

/// <summary>
/// Unit tests for Function9 (DriverLicenseService.SubmitAsync, UC-3.5.2).
/// Maps to UTCID01..UTCID15 in the test-case table.
/// Real repositories on EF InMemory; AI/Cloudinary/mail/limiter faked.
/// </summary>
public class SubmitDriverLicenseTests
{
    private sealed class FakeUserContext : ICurrentUserContext
    {
        private readonly long? _userId;
        public FakeUserContext(long? userId) => _userId = userId;
        public long? UserId => _userId;
    }

    private sealed class FakeUserRepo : IUserRepository
    {
        public User? User;
        public CustomerProfile? Profile;
        public Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(User != null && User.Id == id ? User : null);
        public Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Profile);
        public void UpdateCustomerProfile(CustomerProfile profile) { }
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
        public Task<CustomerProfile?> GetByNationalIdHashAsync(string hash, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerProfile?> GetOwnerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void UpdateOwnerProfile(OwnerProfile profile) => throw new NotImplementedException();
        public Task AddOwnerApplicationAsync(OwnerApplication application, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerApplication?> GetLatestOwnerApplicationByUserIdAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> HasActiveOwnerApplicationAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void UpdateOwnerApplication(OwnerApplication application) => throw new NotImplementedException();
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

    private sealed class FakeCatalog : IVehicleCatalogRepository
    {
        private readonly Func<IReadOnlyCollection<string>, IReadOnlyCollection<string>> _resolve;
        public FakeCatalog(Func<IReadOnlyCollection<string>, IReadOnlyCollection<string>> resolve) => _resolve = resolve;
        public Task<IReadOnlyCollection<string>> GetAllowedVehicleTypesForDriverLicenseClassesAsync(IReadOnlyCollection<string> licenseClassCodes, CancellationToken cancellationToken = default)
            => Task.FromResult(_resolve(licenseClassCodes));
        private static IQueryable<T> Empty<T>() => Enumerable.Empty<T>().AsQueryable();
        public IQueryable<VehicleBrand> VehicleBrands => Empty<VehicleBrand>();
        public IQueryable<VehicleModel> VehicleModels => Empty<VehicleModel>();
        public IQueryable<VehicleModelVariant> VehicleModelVariants => Empty<VehicleModelVariant>();
        public IQueryable<DriverLicenseClass> DriverLicenseClasses => Empty<DriverLicenseClass>();
        public IQueryable<DriverLicenseClassCompatibility> DriverLicenseClassCompatibility => Empty<DriverLicenseClassCompatibility>();
        public IQueryable<VehicleFeature> VehicleFeatures => Empty<VehicleFeature>();
        public IQueryable<Vehicle> Vehicles => Empty<Vehicle>();
        public IQueryable<VehicleImage> VehicleImages => Empty<VehicleImage>();
        public IQueryable<VehicleFeatureMapping> VehicleFeatureMappings => Empty<VehicleFeatureMapping>();
        public IQueryable<VehicleDocument> VehicleDocuments => Empty<VehicleDocument>();
        public IQueryable<Area> Areas => Empty<Area>();
        public IQueryable<PricingRegion> PricingRegions => Empty<PricingRegion>();
        public IQueryable<VehiclePricing> VehiclePricings => Empty<VehiclePricing>();
        public IQueryable<VehicleModelPricing> VehicleModelPricings => Empty<VehicleModelPricing>();
        public IQueryable<PricingRule> PricingRules => Empty<PricingRule>();
        public IQueryable<PlatformFeeRule> PlatformFeeRules => Empty<PlatformFeeRule>();
        public IQueryable<BlockedDate> BlockedDates => Empty<BlockedDate>();
        public IQueryable<Booking> Bookings => Empty<Booking>();
        public IQueryable<CmsPage> CmsPages => Empty<CmsPage>();
        public IQueryable<OwnerProfile> OwnerProfiles => Empty<OwnerProfile>();
        public IQueryable<User> Users => Empty<User>();
        public Task<VehicleBrand?> GetVehicleBrandByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehicleModel?> GetVehicleModelByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehicleModelVariant?> GetVehicleModelVariantByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<DriverLicenseClass?> GetDriverLicenseClassByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehicleFeature?> GetVehicleFeatureByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Area?> GetAreaByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PricingRegion?> GetPricingRegionByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehiclePricing?> GetVehiclePricingByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehicleModelPricing?> GetVehicleModelPricingByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PricingRule?> GetPricingRuleByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PlatformFeeRule?> GetPlatformFeeRuleByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PlatformFeeRule?> GetActivePlatformFeeRuleAsync(long ownerId, DateTime effectiveAt, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Vehicle?> GetVehicleByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Vehicle?> GetVehicleWithDetailsByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<Vehicle?> GetVehicleByIdAndOwnerIdAsync(long id, long ownerId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> VehicleBrandExistsAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> VehicleModelExistsAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> PricingRegionExistsAsync(int id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehicleModelPricing?> GetActiveVehicleModelPricingByModelIdAsync(int modelId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<PricingRule>> GetActivePricingRulesForVehicleAsync(Vehicle vehicle, int? pricingRegionId, DateOnly date, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<AffectedAutoVehiclePricing>> GetAffectedAutoVehiclePricingsAsync(IReadOnlyCollection<PricingRuleScope> scopes, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<PricingRuleResponse>> GetPricingRulesAsync(string? keyword, int? brandId, int? modelId, int? pricingRegionId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PricingRuleResponse?> GetPricingRuleResponseByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<VehicleListItemResponse>> GetOwnerVehiclesAsync(long ownerId, string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? status, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VehicleImageResponse>> GetVehicleImageResponsesAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VehicleFeatureResponse>> GetVehicleFeatureResponsesAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VehicleDocument>> GetVehicleDocumentsAsync(long vehicleId, bool includeDeleted = false, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VehicleDocument>> GetCurrentVehicleDocumentsAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VehicleFeatureMapping>> GetVehicleFeatureMappingsAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<VehicleDocument>> GetReplacedVehicleDocumentsForCleanupAsync(long vehicleId, long currentDocumentId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<int> CountActiveVehicleFeaturesAsync(IReadOnlyCollection<int> ids, string normalizedVehicleType, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<VehicleModerationListItem>> GetModerationVehiclesAsync(IReadOnlyCollection<string>? statuses, IReadOnlyCollection<VehicleDocumentVerificationStatus>? documentStatuses, string? keyword, string? vehicleType, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> HasVerifiedCurrentDocumentAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<VehicleDocument?> GetVehicleDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PagedResult<VehicleListItemResponse>> GetAvailableVehiclesAsync(string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, decimal? priceFrom, decimal? priceTo, string? featureIds, DateTime? searchStartDate = null, DateTime? searchEndDate = null, string? brandIds = null, string? transmissions = null, string? fuelTypes = null, string? bodyTypes = null, string? bikeTypes = null, int? areaId = null, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<BusyPeriod>> GetVehicleBusyPeriodsAsync(long vehicleId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CatalogBrandResponse>> GetCatalogBrandsAsync(string? vehicleType, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CatalogModelResponse>> GetCatalogModelsAsync(int? brandId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CatalogVariantResponse>> GetCatalogVariantsAsync(int? modelId, string? vehicleType, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CatalogFeatureResponse>> GetCatalogFeaturesAsync(string? vehicleType, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CatalogAreaResponse>> GetCatalogAreasAsync(string? province, int? pricingRegionId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<CatalogPricingRegionResponse>> GetCatalogPricingRegionsAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<bool> OwnerExistsAsync(long ownerId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void Add<T>(T entity) where T : class => throw new NotImplementedException();
        public void Remove<T>(T entity) where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeAi : IDriverLicenseVerificationClient
    {
        private readonly DriverLicenseVerificationResult? _result;
        private readonly Exception? _throw;
        public FakeAi(DriverLicenseVerificationResult? result, Exception? throwEx = null)
        {
            _result = result;
            _throw = throwEx;
        }
        public Task<DriverLicenseVerificationResult> VerifyAsync(DriverLicenseVerificationFileRequest request, CancellationToken cancellationToken = default)
            => _throw != null ? Task.FromException<DriverLicenseVerificationResult>(_throw) : Task.FromResult(_result!);
    }

    private sealed class FakeLog : IDriverLicenseVerificationLogService
    {
        public Task LogAsync(DriverLicenseVerificationLogEntry entry, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeLimiter : IDriverLicenseUploadAttemptLimiter
    {
        private readonly bool _locked;
        public FakeLimiter(bool locked = false) => _locked = locked;
        public Task<DriverLicenseUploadAttemptState> GetStateAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
            => Task.FromResult(new DriverLicenseUploadAttemptState
            {
                LockedUntil = _locked ? DateTime.UtcNow.AddMinutes(30) : null,
            });
        public Task RegisterFailureAsync(long userId, string vehicleType, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task RegisterAcceptedAsync(long userId, string vehicleType, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeCloudinary : ICloudinaryService
    {
        private readonly Exception? _uploadThrow;
        public FakeCloudinary(Exception? uploadThrow = null) => _uploadThrow = uploadThrow;
        public Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
            => _uploadThrow != null
                ? Task.FromException<CloudinaryUploadResult>(_uploadThrow)
                : Task.FromResult(new CloudinaryUploadResult("pub-1", "https://img/front.jpg", 100, 100, 10));
        public Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60) => throw new NotImplementedException();
        public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class TestUow : IUnitOfWork
    {
        private readonly AppDbContext _context;
        public TestUow(AppDbContext context) => _context = context;
        public void Dispose() { }
        public IGenericRepository<T> Repository<T>() where T : BaseEntity => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => _context.SaveChangesAsync(cancellationToken);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeNotif : INotificationService
    {
        public Task<NotificationResponse> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
            => Task.FromResult(new NotificationResponse());
        public Task<PagedResult<NotificationResponse>> GetMineAsync(bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<NotificationResponse> MarkAsReadAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MarkAllNotificationsReadResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<BroadcastNotificationResponse> BroadcastAsync(BroadcastNotificationRequest request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeEncryption : IEncryptionService
    {
        public string? Encrypt(string? plainText) => plainText is null ? null : "ENC:" + plainText;
        public string? Decrypt(string? cipherTextBase64)
            => cipherTextBase64 is not null && cipherTextBase64.StartsWith("ENC:") ? cipherTextBase64.Substring(4) : cipherTextBase64;
    }

    private sealed class FakeImageDownloader : IImageDownloader
    {
        public Task<byte[]> DownloadAsync(string url, CancellationToken cancellationToken = default)
            => Task.FromResult<byte[]>([1, 2, 3]);
    }

    private static DriverLicenseVerificationResult PassAi(string number, string licenseClass) => new()
    {
        Valid = true,
        Recommendation = "Pass",
        Message = "OK",
        OcrConfidence = 0.95m,
        RawResponse = "{}",
        Extracted = new DriverLicenseExtractedResult { DriverLicenseNumber = number, LicenseClass = licenseClass },
    };

    private sealed class Harness : IDisposable
    {
        public readonly AppDbContext Context;
        public readonly FakeUserRepo Users = new();
        public readonly DriverLicenseService Service;

        public Harness(
            long? userId = 1,
            DriverLicenseVerificationResult? aiResult = null,
            Exception? aiThrow = null,
            bool limiterLocked = false,
            Func<IReadOnlyCollection<string>, IReadOnlyCollection<string>>? allowedTypes = null,
            Exception? uploadThrow = null)
        {
            Context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
            Users.User = userId == null ? null : new User { Id = 1, FullName = "Test User", Email = "t@t.com", Status = "Active" };
            Users.Profile = userId == null ? null : new CustomerProfile { UserId = 1 };
            Service = new DriverLicenseService(
                new FakeUserContext(userId),
                Users,
                new FakeCatalog(allowedTypes ?? (_ => ["Motorbike", "Car"])),
                new DriverLicenseVerificationRepository(Context, new FakeEncryption()),
                new CustomerDriverLicenseRepository(Context),
                new FakeAi(aiResult ?? PassAi("480248001234", "A1"), aiThrow),
                new FakeLog(),
                new FakeLimiter(limiterLocked),
                new FakeCloudinary(uploadThrow),
                new TestUow(Context),
                NullLogger<DriverLicenseService>.Instance,
                new FakeNotif(),
                new FakeEncryption(),
                new FakeImageDownloader());
        }

        public void Dispose() => Context.Dispose();

        public Task<DriverLicenseSubmitResponse> Submit(string vehicleType = "Motorbike")
            => Service.SubmitAsync(new MemoryStream([1, 2, 3]), "front.jpg", vehicleType);

        public void SeedLicense(string vehicleType, string number, string licenseClass, DateTime verifiedAt, DateTime? lastSubmittedAt)
            => Context.CustomerDriverLicenses.Add(new CustomerDriverLicense
            {
                UserId = 1,
                VehicleType = vehicleType,
                LicenseNumber = number,
                LicenseClass = licenseClass,
                FrontImageUrl = "https://img/old.jpg",
                FrontImagePublicId = "old-pub",
                VerificationRequestId = 100,
                VerifiedAt = verifiedAt,
                LastSubmittedAt = lastSubmittedAt,
                CreatedAt = verifiedAt,
            });

        public void SeedRequest(string vehicleType, string status, DateTime? createdAt = null)
            => Context.VerificationRequests.Add(new VerificationRequest
            {
                UserId = 1,
                Type = "DriverLicense",
                RequestedVehicleType = vehicleType,
                Status = status,
                FrontImagePublicId = "req-pub",
                FrontImageUrl = "https://img/req.jpg",
                CreatedAt = createdAt ?? DateTime.UtcNow,
            });

        public async Task SaveAsync() => await Context.SaveChangesAsync();
    }

    [Fact] // UTCID01
    public async Task InvalidVehicleType_ThrowsInvalid()
    {
        using var h = new Harness();
        var act = () => h.Submit("Truck");
        var ex = await Assert.ThrowsAsync<AppException>(act);
        Assert.Same(ErrorCode.DRIVER_LICENSE_VEHICLE_TYPE_INVALID, ex.ErrorCode);
    }

    [Fact] // UTCID02
    public async Task NotLoggedIn_ThrowsUnauthorized()
    {
        using var h = new Harness(userId: null);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.UNAUTHORIZED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID03
    public async Task NoUser_ThrowsUserNotFound()
    {
        using var h = new Harness();
        h.Users.User = null;
        var act = () => h.Submit();
        Assert.Same(ErrorCode.USER_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID04
    public async Task NoProfile_ThrowsUserNotFound()
    {
        using var h = new Harness();
        h.Users.Profile = null;
        var act = () => h.Submit();
        Assert.Same(ErrorCode.USER_NOT_FOUND, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID05
    public async Task PendingExists_ThrowsPending()
    {
        using var h = new Harness();
        h.SeedRequest("Motorbike", "Pending");
        await h.SaveAsync();
        var act = () => h.Submit();
        Assert.Same(ErrorCode.DRIVER_LICENSE_VERIFICATION_PENDING, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID06
    public async Task LimiterLocked_ThrowsLocked()
    {
        using var h = new Harness(limiterLocked: true);
        var act = () => h.Submit();
        Assert.Same(ErrorCode.DRIVER_LICENSE_UPLOAD_LOCKED, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID07
    public async Task WithinCooldown_ThrowsTooSoon()
    {
        using var h = new Harness();
        h.SeedLicense("Motorbike", "480248001234", "A1", DateTime.UtcNow.AddDays(-30), DateTime.UtcNow);
        await h.SaveAsync();
        var act = () => h.Submit();
        var ex = await Assert.ThrowsAsync<AppException>(act);
        Assert.Same(ErrorCode.DRIVER_LICENSE_UPDATE_TOO_SOON, ex.ErrorCode);
        ex.Errors.Should().ContainSingle().Which.Should().Contain("sau ngày");
    }

    [Fact] // UTCID08
    public async Task RejectedLatest_BypassesCooldown()
    {
        using var h = new Harness();
        h.SeedLicense("Motorbike", "480248001234", "A1", DateTime.UtcNow.AddDays(-30), DateTime.UtcNow);
        h.SeedRequest("Motorbike", "Rejected", DateTime.UtcNow.AddMinutes(-5));
        await h.SaveAsync();
        var response = await h.Submit();
        response.Status.Should().Be("Verified");
        response.Verified.Should().BeTrue();
    }

    [Fact] // UTCID09 boundary
    public async Task ExpiredCooldown_AllowsUpdate()
    {
        using var h = new Harness();
        h.SeedLicense("Motorbike", "480248001234", "A1",
            DateTime.UtcNow.AddDays(-40), DateTime.UtcNow.AddDays(-7).AddMinutes(-1));
        await h.SaveAsync();
        var response = await h.Submit();
        response.Status.Should().Be("Verified");
    }

    [Fact] // UTCID10 boundary
    public async Task OneSecondBeforeExpiry_BlocksUpdate()
    {
        using var h = new Harness();
        h.SeedLicense("Motorbike", "480248001234", "A1",
            DateTime.UtcNow.AddDays(-40), DateTime.UtcNow.AddDays(-7).AddSeconds(1));
        await h.SaveAsync();
        var act = () => h.Submit();
        Assert.Same(ErrorCode.DRIVER_LICENSE_UPDATE_TOO_SOON, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact] // UTCID11
    public async Task AiThrows_ThrowsVerificationFailed()
    {
        using var h = new Harness(aiThrow: new InvalidOperationException("boom"));
        var act = () => h.Submit();
        var ex = await Assert.ThrowsAsync<AppException>(act);
        Assert.Same(ErrorCode.DRIVER_LICENSE_VERIFICATION_FAILED, ex.ErrorCode);
        (await h.Context.VerificationRequests.CountAsync()).Should().Be(0);
    }

    [Fact] // UTCID12
    public async Task AiReject_ReturnsRejectWithoutRequestRow()
    {
        using var h = new Harness(aiResult: new DriverLicenseVerificationResult
        {
            Valid = false, Recommendation = "Reject", Message = "Blurry", OcrConfidence = 0.2m,
            RawResponse = "{}", Extracted = new DriverLicenseExtractedResult(),
        });
        var response = await h.Submit();
        response.Status.Should().Be("Reject");
        response.Verified.Should().BeFalse();
        (await h.Context.VerificationRequests.CountAsync()).Should().Be(0);
    }

    [Fact] // UTCID13
    public async Task ClassMismatch_ReturnsRejectWithFlag()
    {
        using var h = new Harness(
            aiResult: PassAi("790123004567", "A1"),
            allowedTypes: _ => ["Motorbike"]);
        var response = await h.Submit("Car");
        response.Status.Should().Be("Reject");
        response.Flags.Should().Contain("LICENSE_CLASS_NOT_VALID_FOR_REQUESTED_VEHICLE");
        (await h.Context.VerificationRequests.CountAsync()).Should().Be(0);
    }

    [Fact] // UTCID14
    public async Task PassValid_ReturnsVerifiedAndUpserts()
    {
        using var h = new Harness();
        var response = await h.Submit();
        response.Status.Should().Be("Verified");
        response.Verified.Should().BeTrue();
        response.DriverLicenseNumber.Should().Be("480248001234");
        var row = await h.Context.CustomerDriverLicenses
            .SingleAsync(x => x.UserId == 1 && x.VehicleType == "Motorbike");
        row.LicenseClass.Should().Be("A1");
        row.LastSubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
    }

    [Fact] // UTCID15
    public async Task ManualReview_ReturnsPendingWithRequestRow()
    {        using var h = new Harness(aiResult: new DriverLicenseVerificationResult
        {
            Valid = false, Recommendation = "ManualReview", Message = "Unsure", OcrConfidence = 0.5m,
            RawResponse = "{}",
            Extracted = new DriverLicenseExtractedResult { DriverLicenseNumber = "480248001234", LicenseClass = "A1" },
        });
        var response = await h.Submit();
        response.Status.Should().Be("Pending");
        response.Verified.Should().BeFalse();
        var row = await h.Context.VerificationRequests
            .SingleAsync(x => x.UserId == 1 && x.RequestedVehicleType == "Motorbike");
        row.Status.Should().Be("Pending");
    }

    [Fact] // UTCID16
    public async Task PassExistingRow_UpdatesRowInsteadOfCreating()
    {
        using var h = new Harness(aiResult: PassAi("480248009999", "A1"));
        h.SeedLicense("Motorbike", "480248001234", "A1",
            DateTime.UtcNow.AddDays(-40), DateTime.UtcNow.AddDays(-8));
        await h.SaveAsync();
        var response = await h.Submit();
        response.Status.Should().Be("Verified");
        var rows = await h.Context.CustomerDriverLicenses
            .Where(x => x.UserId == 1 && x.VehicleType == "Motorbike")
            .ToListAsync();
        rows.Should().ContainSingle();
        rows[0].LicenseNumber.Should().Be("ENC:480248009999");
        rows[0].LastSubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
    }

    [Fact] // UTCID17
    public async Task CloudinaryThrows_MarksRequestFailedAndRethrowsOriginal()
    {
        using var h = new Harness(uploadThrow: new InvalidOperationException("storage down"));
        var act = () => h.Submit();
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(act);
        ex.Message.Should().Be("storage down");
        var row = await h.Context.VerificationRequests
            .SingleAsync(x => x.UserId == 1 && x.RequestedVehicleType == "Motorbike");
        row.Status.Should().Be("Failed");
        row.DecisionReason.Should().Be("storage down");
    }

    private sealed class FakeDriverLicenseService : IDriverLicenseService
    {
        private readonly DriverLicenseSubmitResponse _response;
        public FakeDriverLicenseService(DriverLicenseSubmitResponse response) => _response = response;
        public Task<DriverLicenseStatusResponse> GetCurrentAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<DriverLicenseSubmitResponse> SubmitAsync(Stream image, string fileName, string requestedVehicleType, CancellationToken cancellationToken = default)
            => Task.FromResult(_response);
        public Task<PagedResult<DriverLicenseVerificationListItem>> GetVerificationsAsync(string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<DriverLicenseVerificationRequestDto> GetVerificationByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<DriverLicenseVerificationResult> TestOcrAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<DriverLicenseVerificationResult> TestOcrUploadAsync(byte[] imageBytes, string fileName, string? fullName, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task ApproveAsync(long id, DriverLicenseApproveRequest request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task RejectAsync(long id, string? reason, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task RequestMoreInfoAsync(long id, string? reason, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private static FormFile TestFile(string fileName, int sizeBytes)
    {
        var bytes = new byte[sizeBytes];
        return new FormFile(new MemoryStream(bytes), 0, sizeBytes, "frontImage", fileName);
    }

    [Fact] // UTCID18
    public async Task Controller_EmptyFile_ReturnsFileInvalid()
    {
        var controller = new DriverLicensesController(new FakeDriverLicenseService(
            new DriverLicenseSubmitResponse { Status = "Verified", Verified = true }));
        var result = await controller.Submit(TestFile("front.jpg", 0), "Motorbike", CancellationToken.None);
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        var body = Assert.IsType<ApiResponse<DriverLicenseSubmitResponse>>(badRequest.Value);
        body.Code.Should().Be("LICENSE_8302");
    }

    [Fact] // UTCID19
    public async Task Controller_BadExtension_ReturnsFileInvalid()
    {
        var controller = new DriverLicensesController(new FakeDriverLicenseService(
            new DriverLicenseSubmitResponse { Status = "Verified", Verified = true }));
        var result = await controller.Submit(TestFile("front.pdf", 10), "Motorbike", CancellationToken.None);
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        var body = Assert.IsType<ApiResponse<DriverLicenseSubmitResponse>>(badRequest.Value);
        body.Code.Should().Be("LICENSE_8302");
    }

    [Fact] // UTCID20
    public async Task Controller_OversizeFile_ReturnsFileInvalid()
    {
        var controller = new DriverLicensesController(new FakeDriverLicenseService(
            new DriverLicenseSubmitResponse { Status = "Verified", Verified = true }));
        var result = await controller.Submit(TestFile("front.jpg", 6 * 1024 * 1024), "Motorbike", CancellationToken.None);
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        var body = Assert.IsType<ApiResponse<DriverLicenseSubmitResponse>>(badRequest.Value);
        body.Code.Should().Be("LICENSE_8302");
    }

    [Fact] // UTCID21
    public async Task Controller_ValidFile_ForwardsToService()
    {
        var controller = new DriverLicensesController(new FakeDriverLicenseService(
            new DriverLicenseSubmitResponse { Status = "Verified", Verified = true }));
        var result = await controller.Submit(TestFile("front.jpg", 10), "Motorbike", CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<ApiResponse<DriverLicenseSubmitResponse>>(ok.Value);
        body.Status.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.Verified.Should().BeTrue();
    }

    [Fact] // UTCID22
    public async Task MotorcycleAlias_NormalizedToMotorbike()
    {
        using var h = new Harness();
        var response = await h.Submit("Motorcycle");
        response.Status.Should().Be("Verified");
        response.RequestedVehicleType.Should().Be("Motorbike");
        var row = await h.Context.CustomerDriverLicenses
            .SingleAsync(x => x.UserId == 1 && x.VehicleType == "Motorbike");
        row.VehicleType.Should().Be("Motorbike");
    }
}
