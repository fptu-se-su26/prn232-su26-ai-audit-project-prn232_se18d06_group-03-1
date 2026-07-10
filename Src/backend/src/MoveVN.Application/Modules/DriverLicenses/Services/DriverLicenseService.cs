using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.DriverLicenses.Services;

public class DriverLicenseService : IDriverLicenseService
{
    private const string VerificationType = "DriverLicense";
    private static readonly TimeSpan VerifiedUpdateCooldown = TimeSpan.FromDays(3);

    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly IVehicleCatalogRepository _vehicleCatalogRepository;
    private readonly IDriverLicenseVerificationRepository _verificationRepository;
    private readonly ICustomerDriverLicenseRepository _customerDriverLicenseRepository;
    private readonly IDriverLicenseVerificationClient _verificationClient;
    private readonly IDriverLicenseVerificationLogService _logService;
    private readonly IDriverLicenseUploadAttemptLimiter _attemptLimiter;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DriverLicenseService> _logger;
    private readonly INotificationService _notificationService;

    public DriverLicenseService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        IVehicleCatalogRepository vehicleCatalogRepository,
        IDriverLicenseVerificationRepository verificationRepository,
        ICustomerDriverLicenseRepository customerDriverLicenseRepository,
        IDriverLicenseVerificationClient verificationClient,
        IDriverLicenseVerificationLogService logService,
        IDriverLicenseUploadAttemptLimiter attemptLimiter,
        ICloudinaryService cloudinaryService,
        IUnitOfWork unitOfWork,
        ILogger<DriverLicenseService> logger,
        INotificationService notificationService)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _vehicleCatalogRepository = vehicleCatalogRepository;
        _verificationRepository = verificationRepository;
        _customerDriverLicenseRepository = customerDriverLicenseRepository;
        _verificationClient = verificationClient;
        _logService = logService;
        _attemptLimiter = attemptLimiter;
        _cloudinaryService = cloudinaryService;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<DriverLicenseStatusResponse> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var profile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);
        var latest = await _verificationRepository.GetLatestByUserIdAsync(userId, cancellationToken);
        var licenses = await _customerDriverLicenseRepository.GetByUserIdAsync(userId, cancellationToken);
        var licenseDtos = licenses.Select(ToDto).ToList();
        var verifiedVehicleTypes = licenseDtos
            .Select(x => x.VehicleType)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var latestLicense = licenses.OrderByDescending(x => x.VerifiedAt).FirstOrDefault();
        return new DriverLicenseStatusResponse
        {
            Verified = verifiedVehicleTypes.Count > 0 || profile?.DriverLicenseVerified == true,
            Status = latest?.Status ?? (verifiedVehicleTypes.Count > 0 || profile?.DriverLicenseVerified == true ? "Verified" : "None"),
            DriverLicenseNumber = latestLicense?.LicenseNumber,
            LicenseClass = latestLicense?.LicenseClass,
            VerifiedVehicleTypes = verifiedVehicleTypes,
            Licenses = licenseDtos,
            VerifiedAt = latestLicense?.VerifiedAt,
            CanUpdateAfter = latestLicense?.VerifiedAt.Add(VerifiedUpdateCooldown),
            LatestRequest = latest is null ? null : ToDto(latest)
        };
    }

    public async Task<DriverLicenseSubmitResponse> SubmitAsync(Stream image, string fileName, string requestedVehicleType, CancellationToken cancellationToken = default)
    {
        requestedVehicleType = NormalizeRequestedVehicleType(requestedVehicleType);
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        var profile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        var pending = await _verificationRepository.GetPendingByUserIdAsync(userId, requestedVehicleType, cancellationToken);
        if (pending is not null)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_VERIFICATION_PENDING);
        }

        var attemptState = await _attemptLimiter.GetStateAsync(userId, requestedVehicleType, cancellationToken);
        if (attemptState.IsLocked)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_UPLOAD_LOCKED, [
                $"Bạn đã gửi ảnh GPLX không đạt quá nhiều lần. Vui lòng thử lại sau {attemptState.LockedUntil:yyyy-MM-dd HH:mm:ss} UTC."
            ]);
        }

        var currentLicenses = await _customerDriverLicenseRepository.GetByUserIdAsync(userId, cancellationToken);
        var profileVerifiedVehicleTypes = currentLicenses
            .Select(x => x.VehicleType)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var currentLicense = await _customerDriverLicenseRepository.GetByUserIdAndVehicleTypeAsync(userId, requestedVehicleType, cancellationToken);
        if (currentLicense is not null
            && currentLicense.VerifiedAt.Add(VerifiedUpdateCooldown) > DateTime.UtcNow)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_UPDATE_TOO_SOON, [
                $"GPLX chỉ có thể cập nhật lại sau ngày {currentLicense.VerifiedAt.Add(VerifiedUpdateCooldown):yyyy-MM-dd HH:mm:ss} UTC."
            ]);
        }

        byte[] bytes;
        using (var memory = new MemoryStream())
        {
            await image.CopyToAsync(memory, cancellationToken);
            bytes = memory.ToArray();
        }

        DriverLicenseVerificationResult aiResult;
        try
        {
            using var aiStream = new MemoryStream(bytes);
            aiResult = await _verificationClient.VerifyAsync(new DriverLicenseVerificationFileRequest
            {
                FileStream = aiStream,
                FileName = fileName,
                FullName = user.FullName
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            await LogAsync(userId, null, fileName, null, null, null, ex.Message, cancellationToken);
            _logger.LogError(ex, "Driver license AI verification failed for user {UserId}.", userId);
            throw new AppException(ErrorCode.DRIVER_LICENSE_VERIFICATION_FAILED, [ex.Message]);
        }

        if (aiResult.Recommendation is "Reject" or "NeedMoreInfo")
        {
            await _attemptLimiter.RegisterFailureAsync(userId, requestedVehicleType, cancellationToken);
            await LogAsync(userId, null, fileName, aiResult, aiResult.Recommendation, null, null, cancellationToken);
            var message = ToVietnameseMessage(aiResult.Message, aiResult);
            await NotifyDriverLicenseAsync(userId, null, aiResult.Recommendation, message, cancellationToken);
            return new DriverLicenseSubmitResponse
            {
                Status = aiResult.Recommendation,
                Verified = false,
                Message = message,
                DriverLicenseNumber = aiResult.Extracted.DriverLicenseNumber,
                LicenseClass = aiResult.Extracted.LicenseClass,
                RequestedVehicleType = requestedVehicleType,
                VerifiedVehicleTypes = profileVerifiedVehicleTypes,
                OcrConfidence = aiResult.OcrConfidence,
                Flags = aiResult.Flags
            };
        }

        var allowedVehicleTypes = await GetAllowedVehicleTypesAsync(aiResult.Extracted.LicenseClass, cancellationToken);
        if (aiResult.Recommendation == "Pass"
            && aiResult.Valid
            && !allowedVehicleTypes.Contains(requestedVehicleType, StringComparer.OrdinalIgnoreCase))
        {
            aiResult.Valid = false;
            aiResult.Recommendation = "Reject";
            aiResult.LicenseVehicleType = string.Join(",", allowedVehicleTypes);
            aiResult.LicenseClassValidForExpectedVehicle = false;
            if (!aiResult.Flags.Contains("LICENSE_CLASS_NOT_VALID_FOR_REQUESTED_VEHICLE", StringComparer.OrdinalIgnoreCase))
            {
                aiResult.Flags.Add("LICENSE_CLASS_NOT_VALID_FOR_REQUESTED_VEHICLE");
            }

            aiResult.Message = BuildVehicleTypeMismatchMessage(aiResult.Extracted.LicenseClass, requestedVehicleType);
            await _attemptLimiter.RegisterFailureAsync(userId, requestedVehicleType, cancellationToken);
            await LogAsync(userId, null, fileName, aiResult, aiResult.Recommendation, null, null, cancellationToken);
            return new DriverLicenseSubmitResponse
            {
                Status = "Reject",
                Verified = false,
                Message = aiResult.Message,
                DriverLicenseNumber = aiResult.Extracted.DriverLicenseNumber,
                LicenseClass = aiResult.Extracted.LicenseClass,
                RequestedVehicleType = requestedVehicleType,
                VerifiedVehicleTypes = profileVerifiedVehicleTypes,
                OcrConfidence = aiResult.OcrConfidence,
                Flags = aiResult.Flags
            };
        }

        var request = new VerificationRequest
        {
            UserId = userId,
            Type = VerificationType,
            RequestedVehicleType = requestedVehicleType,
            Status = "Processing",
            ExternalProvider = "AI_VERIFICATION",
            ExternalResultJson = aiResult.RawResponse,
            Confidence = aiResult.OcrConfidence,
            ProcessedAt = DateTime.UtcNow,
            DecisionReason = aiResult.Message,
            CreatedAt = DateTime.UtcNow
        };

        await _verificationRepository.AddAsync(request, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _attemptLimiter.RegisterAcceptedAsync(userId, requestedVehicleType, cancellationToken);

        try
        {
            var folder = $"movevn/private/driver-licenses/{userId}/{request.Id}";
            using var cloudStream = new MemoryStream(bytes);
            var upload = await _cloudinaryService.UploadAsync(cloudStream, fileName, $"{folder}/front", cancellationToken);
            request.FrontImagePublicId = upload.PublicId;
            request.FrontImageUrl = upload.Url;

            if (aiResult.Recommendation == "Pass" && aiResult.Valid)
            {
                request.Status = "Verified";
                request.DecisionReason = "AI đã xác minh GPLX thành công.";
                _verificationRepository.Update(request);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await UpsertVerifiedDriverLicenseAsync(profile, request, aiResult, requestedVehicleType, cancellationToken);
            }
            else
            {
                request.Status = "Pending";
                request.DecisionReason = ToVietnameseMessage(aiResult.Message, aiResult, "AI chưa đủ chắc chắn, hồ sơ cần nhân viên kiểm tra.");
                _verificationRepository.Update(request);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            await LogAsync(userId, request.Id, fileName, aiResult, aiResult.Recommendation, upload.PublicId, null, cancellationToken);
            await NotifyDriverLicenseAsync(userId, request.Id, request.Status, request.DecisionReason, cancellationToken);

            return new DriverLicenseSubmitResponse
            {
                Status = request.Status,
                Verified = request.Status == "Verified",
                Message = request.DecisionReason,
                DriverLicenseNumber = aiResult.Extracted.DriverLicenseNumber,
                LicenseClass = aiResult.Extracted.LicenseClass,
                RequestedVehicleType = requestedVehicleType,
                VerifiedVehicleTypes = await GetVerifiedVehicleTypesAsync(userId, cancellationToken),
                OcrConfidence = aiResult.OcrConfidence,
                Flags = aiResult.Flags
            };
        }
        catch (Exception ex)
        {
            request.Status = "Failed";
            request.DecisionReason = ex.Message;
            _verificationRepository.Update(request);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await LogAsync(userId, request.Id, fileName, aiResult, aiResult.Recommendation, request.FrontImagePublicId, ex.Message, cancellationToken);
            throw;
        }
    }

    public Task<PagedResult<DriverLicenseVerificationListItem>> GetVerificationsAsync(
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return _verificationRepository.GetPagedAsync(status, keyword, page, pageSize, cancellationToken);
    }

    public async Task<DriverLicenseVerificationRequestDto> GetVerificationByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _verificationRepository.GetDetailAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.DRIVER_LICENSE_VERIFICATION_NOT_FOUND);
    }

    public async Task ApproveAsync(long id, DriverLicenseApproveRequest approveRequest, CancellationToken cancellationToken = default)
    {
        approveRequest ??= new DriverLicenseApproveRequest();
        var reviewerId = GetCurrentUserId();
        var request = await _verificationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.DRIVER_LICENSE_VERIFICATION_NOT_FOUND);
        if (request.Status != "Pending")
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_REVIEW_INVALID_STATE);
        }

        var profile = await _userRepository.GetCustomerProfileByUserIdAsync(request.UserId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        var result = ParseResult(request.ExternalResultJson);
        var hasManualOverride = HasManualOverride(approveRequest);
        var canManualOverride = CanManualOverrideOcr(result);

        if (hasManualOverride && !canManualOverride)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_MANUAL_OVERRIDE_NOT_ALLOWED);
        }

        if (canManualOverride)
        {
            ApplyManualOverride(result, approveRequest);
            if (string.IsNullOrWhiteSpace(result.Extracted.DriverLicenseNumber) ||
                string.IsNullOrWhiteSpace(result.Extracted.LicenseClass))
            {
                throw new AppException(ErrorCode.DRIVER_LICENSE_MANUAL_FIELDS_REQUIRED);
            }
        }

        request.Status = "Verified";
        request.ReviewedBy = reviewerId;
        request.ReviewedAt = DateTime.UtcNow;
        request.DecisionReason = hasManualOverride
            ? approveRequest.Reason?.Trim() ?? "Nhân viên đã duyệt thủ công vì OCR không đọc được GPLX."
            : "Nhân viên đã duyệt xác minh GPLX.";
        if (hasManualOverride)
        {
            request.ExternalResultJson = JsonSerializer.Serialize(result, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }

        _verificationRepository.Update(request);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var requestedVehicleType = NormalizeRequestedVehicleType(request.RequestedVehicleType ?? string.Empty);
        await UpsertVerifiedDriverLicenseAsync(profile, request, result, requestedVehicleType, cancellationToken);
        await _attemptLimiter.RegisterAcceptedAsync(request.UserId, requestedVehicleType, cancellationToken);
        await NotifyDriverLicenseAsync(request.UserId, request.Id, request.Status, request.DecisionReason, cancellationToken);
    }

    public async Task RejectAsync(long id, string? reason, CancellationToken cancellationToken = default)
    {
        await ReviewRejectLikeAsync(id, "Rejected", reason, cancellationToken);
    }

    public async Task RequestMoreInfoAsync(long id, string? reason, CancellationToken cancellationToken = default)
    {
        await ReviewRejectLikeAsync(id, "NeedMoreInfo", reason, cancellationToken);
    }

    private async Task ReviewRejectLikeAsync(long id, string status, string? reason, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);
        }

        var reviewerId = GetCurrentUserId();
        var request = await _verificationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.DRIVER_LICENSE_VERIFICATION_NOT_FOUND);
        if (request.Status != "Pending")
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_REVIEW_INVALID_STATE);
        }

        request.Status = status;
        request.ReviewedBy = reviewerId;
        request.ReviewedAt = DateTime.UtcNow;
        request.RejectionReason = reason.Trim();
        request.DecisionReason = reason.Trim();
        _verificationRepository.Update(request);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyDriverLicenseAsync(request.UserId, request.Id, request.Status, request.DecisionReason, cancellationToken);
    }

    private async Task NotifyDriverLicenseAsync(
        long userId,
        long? requestId,
        string status,
        string? message,
        CancellationToken cancellationToken)
    {
        var (title, fallbackBody, action) = status switch
        {
            "Verified" => ("GPLX da duoc xac minh", "Giay phep lai xe cua ban da duoc xac minh thanh cong.", "DriverLicenseVerified"),
            "Pending" => ("GPLX dang cho kiem tra", "Anh GPLX cua ban can nhan vien kiem tra them.", "DriverLicensePendingReview"),
            "NeedMoreInfo" => ("GPLX can bo sung", "Vui long chup lai anh GPLX ro hon de tiep tuc xac minh.", "DriverLicenseNeedMoreInfo"),
            "Rejected" or "Reject" => ("GPLX bi tu choi", "Giay phep lai xe cua ban chua dat yeu cau xac minh.", "DriverLicenseRejected"),
            "Failed" => ("Xac minh GPLX that bai", "He thong chua the xac minh GPLX. Vui long thu lai sau.", "DriverLicenseFailed"),
            _ => ("Cap nhat xac minh GPLX", "Trang thai xac minh GPLX cua ban da duoc cap nhat.", "DriverLicenseUpdated")
        };

        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "DriverLicenseVerification",
            Title = title,
            Body = string.IsNullOrWhiteSpace(message) ? fallbackBody : message.Trim(),
            DataJson = JsonSerializer.Serialize(new
            {
                verificationRequestId = requestId,
                documentType = VerificationType,
                status,
                targetPath = "/account/verification/drivers-license",
                action
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    private async Task UpsertVerifiedDriverLicenseAsync(
        CustomerProfile profile,
        VerificationRequest request,
        DriverLicenseVerificationResult result,
        string requestedVehicleType,
        CancellationToken cancellationToken)
    {
        var existing = await _customerDriverLicenseRepository.GetByUserIdAndVehicleTypeAsync(
            request.UserId,
            requestedVehicleType,
            cancellationToken);

        var previousPublicId = existing?.FrontImagePublicId;
        var previousRequestId = existing?.VerificationRequestId;

        if (existing is null)
        {
            await _customerDriverLicenseRepository.AddAsync(new CustomerDriverLicense
            {
                UserId = request.UserId,
                VehicleType = requestedVehicleType,
                LicenseNumber = result.Extracted.DriverLicenseNumber,
                LicenseClass = result.Extracted.LicenseClass,
                FrontImageUrl = request.FrontImageUrl,
                FrontImagePublicId = request.FrontImagePublicId,
                VerificationRequestId = request.Id,
                OcrConfidence = result.OcrConfidence,
                VerifiedAt = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            existing.LicenseNumber = result.Extracted.DriverLicenseNumber;
            existing.LicenseClass = result.Extracted.LicenseClass;
            existing.FrontImageUrl = request.FrontImageUrl;
            existing.FrontImagePublicId = request.FrontImagePublicId;
            existing.VerificationRequestId = request.Id;
            existing.OcrConfidence = result.OcrConfidence;
            existing.VerifiedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            _customerDriverLicenseRepository.Update(existing);
        }

        ApplyVerifiedProfile(profile);
        _userRepository.UpdateCustomerProfile(profile);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(previousPublicId) && previousRequestId.HasValue && previousRequestId.Value != request.Id)
        {
            await DeletePreviousVerifiedFileAsync(request.UserId, request.Id, previousRequestId.Value, previousPublicId, cancellationToken);
        }
    }

    private async Task DeletePreviousVerifiedFileAsync(
        long userId,
        long currentRequestId,
        long previousRequestId,
        string previousPublicId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _cloudinaryService.DeleteAsync(previousPublicId, cancellationToken);
            var previous = await _verificationRepository.GetByIdAsync(previousRequestId, cancellationToken);
            if (previous is null)
            {
                return;
            }

            previous.DeletedAt = DateTime.UtcNow;
            previous.DecisionReason = $"Đã được thay thế bởi hồ sơ xác minh GPLX #{currentRequestId}.";
            _verificationRepository.Update(previous);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _logService.LogAsync(new DriverLicenseVerificationLogEntry
            {
                UserId = userId,
                VerificationRequestId = previous.Id,
                FilePublicId = previousPublicId,
                FileDeletedAt = previous.DeletedAt,
                DeletionReason = previous.DecisionReason
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete previous driver license file for user {UserId}.", userId);
        }
    }

    private async Task LogAsync(
        long userId,
        long? requestId,
        string fileName,
        DriverLicenseVerificationResult? result,
        string? recommendation,
        string? publicId,
        string? error,
        CancellationToken cancellationToken)
    {
        await _logService.LogAsync(new DriverLicenseVerificationLogEntry
        {
            UserId = userId,
            VerificationRequestId = requestId,
            Request = new { fileName },
            Response = result,
            Recommendation = recommendation,
            Flags = result?.Flags ?? [],
            OcrConfidence = result?.OcrConfidence,
            Message = result?.Message,
            ErrorMessage = error,
            FilePublicId = publicId
        }, cancellationToken);
    }

    private static void ApplyVerifiedProfile(CustomerProfile profile)
    {
        profile.DriverLicenseVerified = true;
    }

    private static bool CanManualOverrideOcr(DriverLicenseVerificationResult result)
    {
        var hasOcrFailureFlag = result.Flags.Any(flag =>
            string.Equals(flag, "OCR_ENGINE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(flag, "OCR_PROCESSING_FAILED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(flag, "NO_TEXT_DETECTED", StringComparison.OrdinalIgnoreCase));

        return hasOcrFailureFlag || result.Extracted.RawText.Count == 0;
    }

    private static bool HasManualOverride(DriverLicenseApproveRequest request)
    {
        return !string.IsNullOrWhiteSpace(request.DriverLicenseNumber) ||
               !string.IsNullOrWhiteSpace(request.LicenseClass) ||
               !string.IsNullOrWhiteSpace(request.FullName) ||
               !string.IsNullOrWhiteSpace(request.IssueDate) ||
               !string.IsNullOrWhiteSpace(request.ExpiryDate);
    }

    private static void ApplyManualOverride(DriverLicenseVerificationResult result, DriverLicenseApproveRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.DriverLicenseNumber))
        {
            result.Extracted.DriverLicenseNumber = request.DriverLicenseNumber.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.LicenseClass))
        {
            result.Extracted.LicenseClass = request.LicenseClass.Trim().ToUpperInvariant();
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            result.Extracted.FullName = request.FullName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.IssueDate))
        {
            result.Extracted.IssueDate = request.IssueDate.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.ExpiryDate))
        {
            result.Extracted.ExpiryDate = request.ExpiryDate.Trim();
        }
    }

    private static DriverLicenseVerificationRequestDto ToDto(VerificationRequest request)
    {
        return new DriverLicenseVerificationRequestDto
        {
            Id = request.Id,
            UserId = request.UserId,
            Type = request.Type,
            Status = request.Status,
            FrontImageUrl = request.FrontImageUrl,
            RequestedVehicleType = request.RequestedVehicleType,
            ExternalProvider = request.ExternalProvider,
            ExternalResultJson = request.ExternalResultJson,
            Confidence = request.Confidence,
            DecisionReason = request.DecisionReason,
            ProcessedAt = request.ProcessedAt,
            ReviewedBy = request.ReviewedBy,
            ReviewedAt = request.ReviewedAt,
            RejectionReason = request.RejectionReason,
            CreatedAt = request.CreatedAt
        };
    }

    private static CustomerDriverLicenseDto ToDto(CustomerDriverLicense license)
    {
        return new CustomerDriverLicenseDto
        {
            VehicleType = license.VehicleType,
            DriverLicenseNumber = license.LicenseNumber,
            LicenseClass = license.LicenseClass,
            FrontImageUrl = license.FrontImageUrl,
            VerificationRequestId = license.VerificationRequestId,
            OcrConfidence = license.OcrConfidence,
            VerifiedAt = license.VerifiedAt,
            CanUpdateAfter = license.VerifiedAt.Add(VerifiedUpdateCooldown)
        };
    }

    private async Task<List<string>> GetVerifiedVehicleTypesAsync(
        long userId,
        CancellationToken cancellationToken)
    {
        var vehicleTypes = (await _customerDriverLicenseRepository.GetByUserIdAsync(userId, cancellationToken))
            .Select(x => x.VehicleType)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return vehicleTypes;
    }

    private static DriverLicenseVerificationResult ParseResult(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return new DriverLicenseVerificationResult();
        }

        return JsonSerializer.Deserialize<DriverLicenseVerificationResult>(
            rawJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new DriverLicenseVerificationResult();
    }

    private static string ToVietnameseMessage(string? message, DriverLicenseVerificationResult result, string? fallback = null)
    {
        if (!string.IsNullOrWhiteSpace(message))
        {
            var normalized = message.ToLowerInvariant();
            if (normalized.Contains("no readable text") || normalized.Contains("ocr did not return"))
            {
                return "Không đọc được thông tin trên GPLX. Vui lòng chụp lại ảnh rõ hơn.";
            }

            if (normalized.Contains("markers") || normalized.Contains("license class"))
            {
                return "AI đã đọc được ảnh nhưng cần kiểm tra lại dấu hiệu giấy tờ hoặc hạng GPLX.";
            }

            if (normalized.Contains("ocr.space api key"))
            {
                return "Dịch vụ OCR chưa được cấu hình. Vui lòng thử lại sau.";
            }
        }

        if (!string.IsNullOrWhiteSpace(fallback))
        {
            return fallback;
        }

        return result.Flags.Count == 0
            ? "Ảnh GPLX chưa đạt yêu cầu. Vui lòng chụp lại rõ hơn."
            : $"Ảnh GPLX chưa đạt yêu cầu: {string.Join(", ", result.Flags.Select(ToVietnameseFlag))}.";
    }

    private static string ToVietnameseFlag(string flag)
    {
        return flag switch
        {
            "IMAGE_TOO_BLURRY" => "ảnh bị mờ",
            "IMAGE_TOO_DARK" => "ảnh quá tối",
            "IMAGE_TOO_BRIGHT" => "ảnh quá sáng",
            "IMAGE_TOO_SMALL" => "ảnh quá nhỏ",
            "DOCUMENT_NOT_READABLE" => "không đọc được giấy tờ",
            "NO_TEXT_DETECTED" => "không phát hiện chữ",
            "DRIVER_LICENSE_NUMBER_NOT_FOUND" => "không tìm thấy số GPLX",
            "LICENSE_CLASS_NOT_FOUND" => "không tìm thấy hạng GPLX",
            "LICENSE_CLASS_NOT_RECOGNIZED_IN_VIETNAM" => "hạng GPLX không hợp lệ tại Việt Nam",
            "FULL_NAME_NOT_FOUND" => "không tìm thấy họ tên",
            "FULL_NAME_MISMATCH" => "họ tên không khớp hồ sơ",
            "LICENSE_CLASS_UNCERTAIN" => "chưa chắc chắn hạng GPLX",
            "MINISTRY_MARKER_NOT_FOUND" => "không tìm thấy cơ quan cấp",
            "NATIONAL_MOTTO_NOT_FOUND" => "không tìm thấy quốc hiệu",
            "DRIVER_LICENSE_TITLE_NOT_FOUND" => "không nhận diện tiêu đề GPLX",
            "LOW_OCR_CONFIDENCE" => "độ tin cậy OCR thấp",
            "OCR_ENGINE_UNAVAILABLE" => "dịch vụ OCR chưa sẵn sàng",
            "OCR_PROCESSING_FAILED" => "OCR xử lý thất bại",
            "IMAGE_DECODE_FAILED" => "không đọc được file ảnh",
            _ => flag
        };
    }

    private async Task<IReadOnlyCollection<string>> GetAllowedVehicleTypesAsync(string? licenseClass, CancellationToken cancellationToken)
    {
        var codes = ExtractLicenseClassCodes(licenseClass);
        if (codes.Count == 0)
        {
            return [];
        }

        return await _vehicleCatalogRepository.GetAllowedVehicleTypesForDriverLicenseClassesAsync(codes, cancellationToken);
    }

    private static List<string> ExtractLicenseClassCodes(string? licenseClass)
    {
        if (string.IsNullOrWhiteSpace(licenseClass))
        {
            return [];
        }

        return Regex.Matches(licenseClass.ToUpperInvariant(), @"[A-Z]{1,3}[0-9]?(?:E)?")
            .Select(match => match.Value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string NormalizeRequestedVehicleType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_VEHICLE_TYPE_INVALID, ["Vui lòng chọn loại xe cần xác minh GPLX."]);
        }

        var normalized = value.Trim().Equals("Motorcycle", StringComparison.OrdinalIgnoreCase)
            ? "Motorbike"
            : value.Trim();

        if (!normalized.Equals("Car", StringComparison.OrdinalIgnoreCase)
            && !normalized.Equals("Motorbike", StringComparison.OrdinalIgnoreCase))
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_VEHICLE_TYPE_INVALID, ["Loại xe cần xác minh chỉ hỗ trợ Ô tô hoặc Xe máy."]);
        }

        return normalized.Equals("Car", StringComparison.OrdinalIgnoreCase) ? "Car" : "Motorbike";
    }
    private static string BuildVehicleTypeMismatchMessage(string? licenseClass, string requestedVehicleType)
    {
        var requestedLabel = requestedVehicleType == "Car" ? "ô tô" : "xe máy";
        return string.IsNullOrWhiteSpace(licenseClass)
            ? $"Không đọc được hạng GPLX phù hợp để xác minh {requestedLabel}."
            : $"Hạng GPLX {licenseClass} không phù hợp để xác minh {requestedLabel}.";
    }
    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}
