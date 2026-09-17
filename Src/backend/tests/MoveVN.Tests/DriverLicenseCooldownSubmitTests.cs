using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Services;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Common;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Repositories;

namespace MoveVN.Tests;

/// <summary>
/// End-to-end submit-path coverage for the 7-day GPLX cooldown:
/// real DriverLicenseService + real repositories on EF InMemory.
/// External systems (AI, Cloudinary, mail, Redis) are faked.
/// </summary>
public class DriverLicenseCooldownSubmitTests
{
    private sealed class FakeUserContext : ICurrentUserContext
    {
        public long? UserId => 1;
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        private readonly User _user;
        private readonly CustomerProfile _profile;

        public FakeUserRepository(User user, CustomerProfile profile)
        {
            _user = user;
            _profile = profile;
        }

        public Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult<User?>(id == _user.Id ? _user : null);

        public Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult<CustomerProfile?>(_profile);

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
        public Task<(List<MoveVN.Application.Modules.Owner.DTOs.NationalIdVerificationListItem> Items, int TotalCount)> GetNationalIdVerificationsPagedAsync(string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MoveVN.Application.Modules.Owner.DTOs.NationalIdVerificationDetailDto?> GetNationalIdVerificationDetailAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<(List<MoveVN.Application.Modules.Admin.DTOs.AdminUserListItem> Items, int TotalCount)> GetAdminUserListAsync(string? keyword, string? sortBy, string? role, string? status, bool? isOnline, int page, int pageSize, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<OwnerApplication?> GetOwnerApplicationByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<MoveVN.Application.Modules.Owner.DTOs.StaffOwnerApplicationQueryResult>> GetOwnerApplicationsByFilterAsync(string? status, string? keyword, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<MoveVN.Application.Modules.Owner.DTOs.OwnerApplicationCurrentData?> GetOwnerApplicationCurrentDataAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
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

        private static IQueryable<T> Empty<T>() => Enumerable.Empty<T>().AsQueryable();

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

    private sealed class FakeAiClient : IDriverLicenseVerificationClient
    {
        private readonly DriverLicenseVerificationResult _result;
        public FakeAiClient(DriverLicenseVerificationResult result) => _result = result;
        public Task<DriverLicenseVerificationResult> VerifyAsync(DriverLicenseVerificationFileRequest request, CancellationToken cancellationToken = default)
            => Task.FromResult(_result);
    }

    private sealed class FakeLogService : IDriverLicenseVerificationLogService
    {
        public Task LogAsync(DriverLicenseVerificationLogEntry entry, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeLimiter : IDriverLicenseUploadAttemptLimiter
    {
        public Task<DriverLicenseUploadAttemptState> GetStateAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
            => Task.FromResult(new DriverLicenseUploadAttemptState());
        public Task RegisterFailureAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
        public Task RegisterAcceptedAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeCloudinary : ICloudinaryService
    {
        public Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
            => Task.FromResult(new CloudinaryUploadResult("pub-1", "https://img/front.jpg", 100, 100, 10));
        public Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
        public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60)
            => throw new NotImplementedException();
        public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class TestUnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        public TestUnitOfWork(AppDbContext context) => _context = context;
        public void Dispose() { }
        public IGenericRepository<T> Repository<T>() where T : BaseEntity => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => _context.SaveChangesAsync(cancellationToken);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
    }

    private sealed class FakeNotificationService : INotificationService
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
            => cipherTextBase64 is not null && cipherTextBase64.StartsWith("ENC:")
                ? cipherTextBase64.Substring(4)
                : cipherTextBase64;
    }

    private sealed class Fixture : IDisposable
    {
        public AppDbContext Context { get; }
        public DriverLicenseService Service { get; }

        public Fixture(string number, string licenseClass, IReadOnlyCollection<string> allowedTypes)
        {
            Context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);

            var user = new User { Id = 1, FullName = "Test User", Email = "t@t.com" };
            var profile = new CustomerProfile { UserId = 1 };
            var aiResult = new DriverLicenseVerificationResult
            {
                Valid = true,
                Recommendation = "Pass",
                Message = "OK",
                OcrConfidence = 0.95m,
                RawResponse = "{}",
                Extracted = new DriverLicenseExtractedResult
                {
                    DriverLicenseNumber = number,
                    LicenseClass = licenseClass,
                },
            };

            Service = new DriverLicenseService(
                new FakeUserContext(),
                new FakeUserRepository(user, profile),
                new FakeCatalog(_ => allowedTypes),
                new DriverLicenseVerificationRepository(Context, new FakeEncryption()),
                new CustomerDriverLicenseRepository(Context),
                new FakeAiClient(aiResult),
                new FakeLogService(),
                new FakeLimiter(),
                new FakeCloudinary(),
                new TestUnitOfWork(Context),
                NullLogger<DriverLicenseService>.Instance,
                new FakeNotificationService(),
                new FakeEncryption());
        }

        public void Dispose() => Context.Dispose();
    }

    private static CustomerDriverLicense MotorbikeRow(DateTime verifiedAt, DateTime? lastSubmittedAt) => new()
    {
        UserId = 1,
        VehicleType = "Motorbike",
        LicenseNumber = "480248001234",
        LicenseClass = "A1",
        FrontImageUrl = "https://img/old.jpg",
        FrontImagePublicId = "old-pub",
        VerificationRequestId = 100,
        VerifiedAt = verifiedAt,
        LastSubmittedAt = lastSubmittedAt,
        CreatedAt = verifiedAt,
    };

    private static VerificationRequest RejectedCarRequest(DateTime createdAt) => new()
    {
        UserId = 1,
        Type = "DriverLicense",
        RequestedVehicleType = "Car",
        Status = "Rejected",
        FrontImagePublicId = "rej-pub",
        FrontImageUrl = "https://img/rej.jpg",
        DecisionReason = "Blurry",
        CreatedAt = createdAt,
    };

    [Fact]
    public async Task Scenario1_ApprovedWithinCooldown_BlocksWithCountdown()
    {
        using var fx = new Fixture("480248001234", "A1", ["Motorbike"]);
        var submittedAt = DateTime.UtcNow;
        fx.Context.CustomerDriverLicenses.Add(MotorbikeRow(submittedAt.AddDays(-30), submittedAt));
        await fx.Context.SaveChangesAsync();

        var act = () => fx.Service.SubmitAsync(new MemoryStream([1, 2, 3]), "front.jpg", "Motorbike");

        Assert.Same(ErrorCode.DRIVER_LICENSE_UPDATE_TOO_SOON, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);

        var status = await fx.Service.GetCurrentAsync();
        var moto = status.Licenses.Should().ContainSingle(x => x.VehicleType == "Motorbike").Subject;
        moto.IsAllowedToUpdate.Should().BeFalse();
        moto.NextAllowedSubmitAt.Should().BeCloseTo(submittedAt.AddDays(7), TimeSpan.FromMinutes(2));
        moto.RemainingCooldownSeconds.Should().BeInRange(604700, 604800);
    }

    [Fact]
    public async Task Scenario2_RejectedCar_BypassesCooldown()
    {
        using var fx = new Fixture("790123004567", "B2", ["Car"]);
        fx.Context.CustomerDriverLicenses.Add(MotorbikeRow(DateTime.UtcNow.AddDays(-30), DateTime.UtcNow.AddDays(-30)));
        fx.Context.VerificationRequests.Add(RejectedCarRequest(DateTime.UtcNow.AddMinutes(-5)));
        await fx.Context.SaveChangesAsync();

        var response = await fx.Service.SubmitAsync(new MemoryStream([1, 2, 3]), "front.jpg", "Car");

        response.Status.Should().Be("Verified");
        response.Verified.Should().BeTrue();
        response.DriverLicenseNumber.Should().Be("790123004567");
        var carRow = await fx.Context.CustomerDriverLicenses
            .SingleAsync(x => x.UserId == 1 && x.VehicleType == "Car");
        carRow.LicenseClass.Should().Be("B2");
    }

    [Fact]
    public async Task Scenario3_CooldownExpired_AllowsUpdate()
    {
        using var fx = new Fixture("480248009999", "A1", ["Motorbike"]);
        fx.Context.CustomerDriverLicenses.Add(
            MotorbikeRow(DateTime.UtcNow.AddDays(-40), DateTime.UtcNow.AddDays(-7).AddMinutes(-1)));
        await fx.Context.SaveChangesAsync();

        var response = await fx.Service.SubmitAsync(new MemoryStream([1, 2, 3]), "front.jpg", "Motorbike");

        response.Status.Should().Be("Verified");
        response.Verified.Should().BeTrue();
        var row = await fx.Context.CustomerDriverLicenses
            .SingleAsync(x => x.UserId == 1 && x.VehicleType == "Motorbike");
        row.LastSubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
        row.LicenseNumber.Should().Be("ENC:480248009999");
    }
}
