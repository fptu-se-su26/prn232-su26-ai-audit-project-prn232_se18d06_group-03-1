using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.UserSecurity.DTOs;
using MoveVN.Application.Modules.UserSecurity.Services;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Tests;

public class PinVerifyDocumentIdentityTests
{
    private sealed class FakeUserContext : ICurrentUserContext
    {
        public long? UserId => 1;
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        private readonly User _user;
        private readonly CustomerProfile? _profile;

        public FakeUserRepository(User user, CustomerProfile? profile = null)
        {
            _user = user;
            _profile = profile;
        }

        public Task<User?> GetByIdTrackedAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult<User?>(id == _user.Id ? _user : null);

        public Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(_profile);

        public Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
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
        public void UpdateCustomerProfile(CustomerProfile profile) => throw new NotImplementedException();
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

    private sealed class FakeLicenseRepository : ICustomerDriverLicenseRepository
    {
        private readonly Dictionary<string, CustomerDriverLicense> _byVehicleType;

        public FakeLicenseRepository(Dictionary<string, CustomerDriverLicense> byVehicleType)
        {
            _byVehicleType = byVehicleType;
        }

        public Task<List<CustomerDriverLicense>> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("Reveal flow must never use the generic user-licenses query.");

        public Task<CustomerDriverLicense?> GetByUserIdAndVehicleTypeAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
            => Task.FromResult(_byVehicleType.TryGetValue(vehicleType, out var license) ? license : null);

        public Task<bool> HasAnyVerifiedAsync(long userId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task AddAsync(CustomerDriverLicense license, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public void Update(CustomerDriverLicense license) => throw new NotImplementedException();
    }

    private sealed class FakeHasher : IPasswordHasherService
    {
        private readonly bool _verifyResult;
        private readonly Func<string, string>? _hashFunc;
        public FakeHasher(bool verifyResult, Func<string, string>? hashFunc = null)
        {
            _verifyResult = verifyResult;
            _hashFunc = hashFunc;
        }
        public string Hash(string value) => _hashFunc != null ? _hashFunc(value) : throw new NotImplementedException();
        public bool Verify(string hash, string value) => _verifyResult;
        public string Sha256(string value) => throw new NotImplementedException();
    }

    private sealed class FakeEncryption : IEncryptionService
    {
        private readonly Func<string?, string?> _decrypt;
        public FakeEncryption(Func<string?, string?> decrypt) => _decrypt = decrypt;
        public string? Encrypt(string? plainText) => throw new NotImplementedException();
        public string? Decrypt(string? cipherTextBase64) => _decrypt(cipherTextBase64);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public void Dispose() { }
        public MoveVN.Application.Interfaces.IGenericRepository<T> Repository<T>() where T : MoveVN.Domain.Common.BaseEntity => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private sealed class FakeOtpService : IOtpService
    {
        public int CreatedCount { get; private set; }
        public string? LastEmail { get; private set; }
        public OtpPurpose? LastPurpose { get; private set; }
        public string ExpectedOtp { get; set; } = "123456";

        public Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default)
        {
            CreatedCount++;
            LastEmail = email;
            LastPurpose = purpose;
            return Task.CompletedTask;
        }

        public Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default)
        {
            if (purpose != OtpPurpose.SetupPin || otp != ExpectedOtp)
            {
                throw new AppException(ErrorCode.OTP_FAIL);
            }
            return Task.CompletedTask;
        }

        public Task<int> GetResendCountAsync(string email, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private static User PinUser() => new()
    {
        Id = 1,
        FullName = "Test User",
        IsPinSet = true,
        SecurityPinHash = "hash",
        FailedPinAttempts = 0,
        PinLockoutEnd = null,
    };

    private static CustomerDriverLicense MotorbikeLicense() => new()
    {
        Id = 10,
        UserId = 1,
        VehicleType = "Motorbike",
        LicenseNumber = "ENC_MOTO",
        LicenseClass = "A1",
        VerifiedAt = new DateTime(2026, 9, 13, 9, 51, 19, DateTimeKind.Utc),
    };

    private static CustomerDriverLicense CarLicense() => new()
    {
        Id = 11,
        UserId = 1,
        VehicleType = "Car",
        LicenseNumber = "ENC_CAR",
        LicenseClass = "B2",
        VerifiedAt = new DateTime(2026, 9, 14, 9, 51, 19, DateTimeKind.Utc),
    };

    private static PinService CreateService(
        User user,
        Dictionary<string, CustomerDriverLicense> licenses,
        CustomerProfile? profile = null,
        Func<string?, string?>? decrypt = null,
        Func<string, string>? hashFunc = null,
        FakeOtpService? otpService = null)
    {
        return new PinService(
            new FakeUserContext(),
            new FakeUserRepository(user, profile),
            new FakeLicenseRepository(licenses),
            new FakeUnitOfWork(),
            new FakeHasher(true, hashFunc),
            otpService ?? new FakeOtpService(),
            new FakeEncryption(decrypt ?? (_ => "480248001234")),
            NullLogger<PinService>.Instance);
    }

    [Fact]
    public async Task Gplx_WithoutVehicleType_ThrowsValidationError()
    {
        var service = new PinService(null!, null!, null!, null!, null!, null!, null!, null!);

        var act = () => service.VerifyPinAndViewDocumentAsync(new VerifyPinViewDocumentRequest
        {
            PinCode = "135790",
            DocumentType = "GPLX",
        });

        Assert.Same(ErrorCode.VALIDATION_ERROR, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact]
    public async Task Gplx_UnknownVehicleType_ThrowsVehicleTypeInvalid()
    {
        var service = new PinService(null!, null!, null!, null!, null!, null!, null!, null!);

        var act = () => service.VerifyPinAndViewDocumentAsync(new VerifyPinViewDocumentRequest
        {
            PinCode = "135790",
            DocumentType = "GPLX",
            VehicleType = "Truck",
        });

        Assert.Same(ErrorCode.DRIVER_LICENSE_VEHICLE_TYPE_INVALID, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact]
    public async Task Gplx_CarRequest_WithOnlyMotorbikeVerified_ReturnsDocumentNotAvailable()
    {
        var service = CreateService(PinUser(), new Dictionary<string, CustomerDriverLicense>
        {
            ["Motorbike"] = MotorbikeLicense(),
        });

        var act = () => service.VerifyPinAndViewDocumentAsync(new VerifyPinViewDocumentRequest
        {
            PinCode = "135790",
            DocumentType = "GPLX",
            VehicleType = "Car",
        });

        Assert.Same(ErrorCode.DOCUMENT_NOT_AVAILABLE, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact]
    public async Task Gplx_MotorbikeRequest_ReturnsOnlyMotorbikeRecord()
    {
        var service = CreateService(
            PinUser(),
            new Dictionary<string, CustomerDriverLicense>
            {
                ["Motorbike"] = MotorbikeLicense(),
                ["Car"] = CarLicense(),
            },
            decrypt: cipher => cipher == "ENC_MOTO" ? "480248001234" : "790123004567");

        var result = await service.VerifyPinAndViewDocumentAsync(new VerifyPinViewDocumentRequest
        {
            PinCode = "135790",
            DocumentType = "GPLX",
            VehicleType = "Motorbike",
        });

        result.DocumentType.Should().Be("GPLX");
        result.VehicleType.Should().Be("Motorbike");
        result.LicenseClass.Should().Be("A1");
        result.DocumentNumber.Should().Be("480248001234");
    }

    [Fact]
    public async Task Gplx_CarRequest_ReturnsOnlyCarRecord()
    {
        var service = CreateService(
            PinUser(),
            new Dictionary<string, CustomerDriverLicense>
            {
                ["Motorbike"] = MotorbikeLicense(),
                ["Car"] = CarLicense(),
            },
            decrypt: cipher => cipher == "ENC_MOTO" ? "480248001234" : "790123004567");

        var result = await service.VerifyPinAndViewDocumentAsync(new VerifyPinViewDocumentRequest
        {
            PinCode = "135790",
            DocumentType = "GPLX",
            VehicleType = "Car",
        });

        result.DocumentType.Should().Be("GPLX");
        result.VehicleType.Should().Be("Car");
        result.LicenseClass.Should().Be("B2");
        result.DocumentNumber.Should().Be("790123004567");
    }

    [Fact]
    public async Task Cccd_Request_IgnoresVehicleType()
    {
        var profile = new CustomerProfile { NationalIdVerified = true, NationalId = "ENC_CCCD" };
        var service = CreateService(PinUser(), new Dictionary<string, CustomerDriverLicense>(),
            profile, _ => "048209123456");

        var result = await service.VerifyPinAndViewDocumentAsync(new VerifyPinViewDocumentRequest
        {
            PinCode = "135790",
            DocumentType = "CCCD",
        });

        result.DocumentType.Should().Be("CCCD");
        result.DocumentNumber.Should().Be("048209123456");
    }

    private static User SetupPinUser() => new()
    {
        Id = 1,
        FullName = "Test User",
        Email = "test.user@gmail.com",
        IsPinSet = false,
        SecurityPinHash = null,
        FailedPinAttempts = 0,
        PinLockoutEnd = null,
    };

    [Fact]
    public async Task SetupPin_WithValidOtp_SetsPin()
    {
        var user = SetupPinUser();
        var otpService = new FakeOtpService();
        var service = CreateService(user, new Dictionary<string, CustomerDriverLicense>(),
            hashFunc: pin => $"HASHED:{pin}", otpService: otpService);

        await service.SetupPinAsync(new SetupPinRequest { PinCode = "135790", Otp = "123456" });

        user.IsPinSet.Should().BeTrue();
        user.SecurityPinHash.Should().Be("HASHED:135790");
        user.FailedPinAttempts.Should().Be(0);
        user.PinLockoutEnd.Should().BeNull();
    }

    [Fact]
    public async Task SetupPin_WithWrongOtp_ThrowsAndDoesNotSetPin()
    {
        var user = SetupPinUser();
        var service = CreateService(user, new Dictionary<string, CustomerDriverLicense>(),
            hashFunc: pin => $"HASHED:{pin}");

        var act = () => service.SetupPinAsync(new SetupPinRequest { PinCode = "135790", Otp = "000000" });

        Assert.Same(ErrorCode.OTP_FAIL, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
        user.IsPinSet.Should().BeFalse();
        user.SecurityPinHash.Should().BeNull();
    }

    [Fact]
    public async Task SetupPin_WhenAlreadySet_ThrowsAlreadySet()
    {
        var user = SetupPinUser();
        user.IsPinSet = true;
        var service = CreateService(user, new Dictionary<string, CustomerDriverLicense>(),
            hashFunc: pin => $"HASHED:{pin}");

        var act = () => service.SetupPinAsync(new SetupPinRequest { PinCode = "135790", Otp = "123456" });

        Assert.Same(ErrorCode.PIN_ALREADY_SET, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
    }

    [Fact]
    public async Task RequestSetupPinOtp_CreatesSetupPinOtp()
    {
        var user = SetupPinUser();
        var otpService = new FakeOtpService();
        var service = CreateService(user, new Dictionary<string, CustomerDriverLicense>(), otpService: otpService);

        await service.RequestSetupPinOtpAsync();

        otpService.CreatedCount.Should().Be(1);
        otpService.LastPurpose.Should().Be(OtpPurpose.SetupPin);
        otpService.LastEmail.Should().Be("test.user@gmail.com");
    }

    [Fact]
    public async Task RequestSetupPinOtp_WhenAlreadySet_ThrowsAlreadySet()
    {
        var user = SetupPinUser();
        user.IsPinSet = true;
        var otpService = new FakeOtpService();
        var service = CreateService(user, new Dictionary<string, CustomerDriverLicense>(), otpService: otpService);

        var act = () => service.RequestSetupPinOtpAsync();

        Assert.Same(ErrorCode.PIN_ALREADY_SET, (await Assert.ThrowsAsync<AppException>(act)).ErrorCode);
        otpService.CreatedCount.Should().Be(0);
    }
}

