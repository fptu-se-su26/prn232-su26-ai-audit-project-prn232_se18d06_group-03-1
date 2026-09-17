using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.UserSecurity.DTOs;
using MoveVN.Application.Modules.UserSecurity.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.UserSecurity.Services;

public class PinService : IPinService
{
    private const int MaxPinAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly Regex PinPattern = new("^\\d{6}$", RegexOptions.Compiled);

    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly ICustomerDriverLicenseRepository _customerDriverLicenseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IOtpService _otpService;
    private readonly IEncryptionService _encryption;
    private readonly ILogger<PinService> _logger;

    public PinService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        ICustomerDriverLicenseRepository customerDriverLicenseRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasherService passwordHasher,
        IOtpService otpService,
        IEncryptionService encryption,
        ILogger<PinService> logger)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _customerDriverLicenseRepository = customerDriverLicenseRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _otpService = otpService;
        _encryption = encryption;
        _logger = logger;
    }

    public async Task<PinStatusResponse> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var user = await GetTrackedUserAsync(cancellationToken);

        return new PinStatusResponse
        {
            IsPinSet = user.IsPinSet,
            FailedPinAttempts = user.FailedPinAttempts,
            PinLockoutEnd = user.PinLockoutEnd,
            LockoutRemainingSeconds = user.PinLockoutEnd is not null && user.PinLockoutEnd > DateTime.UtcNow
                ? (long)(user.PinLockoutEnd.Value - DateTime.UtcNow).TotalSeconds
                : null
        };
    }

    public async Task RequestSetupPinOtpAsync(CancellationToken cancellationToken = default)
    {
        var user = await GetTrackedUserAsync(cancellationToken);

        if (user.IsPinSet)
        {
            throw new AppException(ErrorCode.PIN_ALREADY_SET);
        }

        var email = NormalizeEmail(user.Email);

        try
        {
            await _otpService.CreateOtpAsync(email, OtpPurpose.SetupPin, user.Id, null, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (AppException)
        {
            throw;
        }
        catch (HttpRequestException)
        {
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    public async Task SetupPinAsync(SetupPinRequest request, CancellationToken cancellationToken = default)
    {
        ValidatePinFormat(request.PinCode);

        var user = await GetTrackedUserAsync(cancellationToken);

        if (user.IsPinSet)
        {
            throw new AppException(ErrorCode.PIN_ALREADY_SET);
        }

        var email = NormalizeEmail(user.Email);
        await _otpService.VerifyOtpAsync(email, request.Otp, OtpPurpose.SetupPin, cancellationToken);

        user.SecurityPinHash = _passwordHasher.Hash(request.PinCode);
        user.IsPinSet = true;
        user.FailedPinAttempts = 0;
        user.PinLockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("PIN setup completed for user {UserId}.", user.Id);
    }

    public async Task ChangePinAsync(ChangePinRequest request, CancellationToken cancellationToken = default)
    {
        ValidatePinFormat(request.NewPinCode);

        var user = await GetTrackedUserAsync(cancellationToken);
        EnsurePinSet(user);
        CheckLockout(user);

        if (!VerifyPin(user, request.CurrentPinCode))
        {
            await RegisterFailedAttemptAsync(user, cancellationToken);
            throw new AppException(ErrorCode.PIN_INVALID);
        }

        user.SecurityPinHash = _passwordHasher.Hash(request.NewPinCode);
        user.FailedPinAttempts = 0;
        user.PinLockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("PIN changed for user {UserId}.", user.Id);
    }

    public async Task<ViewDocumentPlaintextResponse> VerifyPinAndViewDocumentAsync(
        VerifyPinViewDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var documentType = NormalizeDocumentType(request.DocumentType);
        var vehicleType = documentType == "GPLX" ? NormalizeVehicleType(request.VehicleType) : null;

        var user = await GetTrackedUserAsync(cancellationToken);
        EnsurePinSet(user);
        CheckLockout(user);

        if (!VerifyPin(user, request.PinCode))
        {
            await RegisterFailedAttemptAsync(user, cancellationToken);
            throw new AppException(ErrorCode.PIN_INVALID);
        }

        user.FailedPinAttempts = 0;
        user.PinLockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = documentType == "CCCD"
            ? await BuildCccdPlaintextAsync(user, cancellationToken)
            : await BuildGplxPlaintextAsync(user, vehicleType!, cancellationToken);

        _logger.LogInformation("Document plaintext requested for user {UserId} type {DocumentType}.", user.Id, response.DocumentType);
        return response;
    }

    public async Task RequestForgotPinOtpAsync(ForgotPinRequestOtpRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var user = await _userRepository.GetByEmailAsync(email, cancellationToken);

        if (user is null)
        {
            _logger.LogInformation("Forgot PIN OTP requested for unknown email; ignored to avoid user enumeration.");
            return;
        }

        try
        {
            await _otpService.CreateOtpAsync(email, OtpPurpose.ForgotPin, user.Id, null, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (AppException)
        {
            throw;
        }
        catch (HttpRequestException)
        {
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    public async Task ResetPinAsync(ForgotPinResetRequest request, CancellationToken cancellationToken = default)
    {
        ValidatePinFormat(request.NewPinCode);

        var email = NormalizeEmail(request.Email);

        await _otpService.VerifyOtpAsync(email, request.OtpCode, OtpPurpose.ForgotPin, cancellationToken);

        var user = await _userRepository.GetByEmailAsync(email, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        user = await _userRepository.GetByIdTrackedAsync(user.Id, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        user.SecurityPinHash = _passwordHasher.Hash(request.NewPinCode);
        user.IsPinSet = true;
        user.FailedPinAttempts = 0;
        user.PinLockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("PIN reset via OTP for user {UserId}.", user.Id);
    }

    private async Task<User> GetTrackedUserAsync(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        return await _userRepository.GetByIdTrackedAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private static void EnsurePinSet(User user)
    {
        if (!user.IsPinSet)
        {
            throw new AppException(ErrorCode.PIN_NOT_SET);
        }
    }

    private static void CheckLockout(User user)
    {
        if (user.PinLockoutEnd is not null && user.PinLockoutEnd > DateTime.UtcNow)
        {
            var remainingMinutes = Math.Max(1, (int)Math.Ceiling((user.PinLockoutEnd.Value - DateTime.UtcNow).TotalMinutes));
            throw new AppException(ErrorCode.PIN_LOCKED,
                [$"Mã PIN đã bị khoá tạm thời do nhập sai nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút."]);
        }
    }

    private bool VerifyPin(User user, string pinCode)
    {
        return !string.IsNullOrWhiteSpace(user.SecurityPinHash)
            && !string.IsNullOrWhiteSpace(pinCode)
            && PinPattern.IsMatch(pinCode)
            && _passwordHasher.Verify(user.SecurityPinHash, pinCode);
    }

    private async Task RegisterFailedAttemptAsync(User user, CancellationToken cancellationToken)
    {
        user.FailedPinAttempts++;
        if (user.FailedPinAttempts >= MaxPinAttempts)
        {
            user.FailedPinAttempts = 0;
            user.PinLockoutEnd = DateTime.UtcNow.Add(LockoutDuration);
        }
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogWarning("PIN verification failed for user {UserId}.", user.Id);
    }

    private async Task<ViewDocumentPlaintextResponse> BuildCccdPlaintextAsync(User user, CancellationToken cancellationToken)
    {
        var profile = await _userRepository.GetCustomerProfileByUserIdAsync(user.Id, cancellationToken);
        if (profile is null || !profile.NationalIdVerified)
        {
            throw new AppException(ErrorCode.DOCUMENT_NOT_AVAILABLE,
                ["CCCD chưa được xác thực."]);
        }

        return new ViewDocumentPlaintextResponse
        {
            DocumentType = "CCCD",
            DocumentNumber = _encryption.Decrypt(profile.NationalId) ?? string.Empty,
            FullName = user.FullName,
            VerifiedAt = null
        };
    }

    private async Task<ViewDocumentPlaintextResponse> BuildGplxPlaintextAsync(
        User user,
        string vehicleType,
        CancellationToken cancellationToken)
    {
        var license = await _customerDriverLicenseRepository.GetByUserIdAndVehicleTypeAsync(
            user.Id, vehicleType, cancellationToken);
        if (license is null)
        {
            throw new AppException(ErrorCode.DOCUMENT_NOT_AVAILABLE,
                [vehicleType == "Car" ? "GPLX ô tô chưa được xác minh." : "GPLX xe máy chưa được xác minh."]);
        }

        return new ViewDocumentPlaintextResponse
        {
            DocumentType = "GPLX",
            DocumentNumber = _encryption.Decrypt(license.LicenseNumber) ?? string.Empty,
            FullName = user.FullName,
            LicenseClass = license.LicenseClass,
            VehicleType = license.VehicleType,
            VerifiedAt = license.VerifiedAt
        };
    }

    private static void ValidatePinFormat(string pinCode, string? confirmPinCode = null)
    {
        if (string.IsNullOrWhiteSpace(pinCode) || !PinPattern.IsMatch(pinCode))
        {
            throw new AppException(ErrorCode.PIN_INVALID_FORMAT);
        }

        if (confirmPinCode is not null && pinCode != confirmPinCode)
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                ["Mã xác nhận PIN không khớp."]);
        }
    }

    private static string NormalizeDocumentType(string? documentType)
    {
        if (string.Equals(documentType, "CCCD", StringComparison.OrdinalIgnoreCase))
        {
            return "CCCD";
        }

        if (string.Equals(documentType, "GPLX", StringComparison.OrdinalIgnoreCase))
        {
            return "GPLX";
        }

        throw new AppException(ErrorCode.VALIDATION_ERROR,
            ["DocumentType phải là CCCD hoặc GPLX."]);
    }

    private static string NormalizeVehicleType(string? vehicleType)
    {
        if (string.IsNullOrWhiteSpace(vehicleType))
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                ["VehicleType là bắt buộc khi xem GPLX."]);
        }

        var normalized = vehicleType.Trim().Equals("Motorcycle", StringComparison.OrdinalIgnoreCase)
            ? "Motorbike"
            : vehicleType.Trim();

        if (!normalized.Equals("Car", StringComparison.OrdinalIgnoreCase)
            && !normalized.Equals("Motorbike", StringComparison.OrdinalIgnoreCase))
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_VEHICLE_TYPE_INVALID,
                ["Loại xe cần xác minh chỉ hỗ trợ Ô tô hoặc Xe máy."]);
        }

        return normalized.Equals("Car", StringComparison.OrdinalIgnoreCase) ? "Car" : "Motorbike";
    }

    private static string NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                ["Email là bắt buộc."]);
        }

        return email.Trim().ToLowerInvariant();
    }
}