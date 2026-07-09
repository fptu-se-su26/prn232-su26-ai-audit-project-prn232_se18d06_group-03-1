using System.Text.Json;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.DriverLicenses.Services;

public class DriverLicenseService : IDriverLicenseService
{
    private const string VerificationType = "DriverLicense";
    private static readonly TimeSpan VerifiedUpdateCooldown = TimeSpan.FromDays(3);

    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly IDriverLicenseVerificationRepository _verificationRepository;
    private readonly IDriverLicenseVerificationClient _verificationClient;
    private readonly IDriverLicenseVerificationLogService _logService;
    private readonly IDriverLicenseUploadAttemptLimiter _attemptLimiter;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DriverLicenseService> _logger;

    public DriverLicenseService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        IDriverLicenseVerificationRepository verificationRepository,
        IDriverLicenseVerificationClient verificationClient,
        IDriverLicenseVerificationLogService logService,
        IDriverLicenseUploadAttemptLimiter attemptLimiter,
        ICloudinaryService cloudinaryService,
        IUnitOfWork unitOfWork,
        ILogger<DriverLicenseService> logger)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _verificationRepository = verificationRepository;
        _verificationClient = verificationClient;
        _logService = logService;
        _attemptLimiter = attemptLimiter;
        _cloudinaryService = cloudinaryService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<DriverLicenseStatusResponse> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var profile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);
        var latest = await _verificationRepository.GetLatestByUserIdAsync(userId, cancellationToken);

        return new DriverLicenseStatusResponse
        {
            Verified = profile?.DriverLicenseVerified ?? false,
            Status = latest?.Status ?? (profile?.DriverLicenseVerified == true ? "Verified" : "None"),
            DriverLicenseNumber = profile?.DriverLicenseNumber,
            LicenseClass = profile?.DriverLicenseClass,
            VerifiedAt = profile?.DriverLicenseVerifiedAt,
            CanUpdateAfter = profile?.DriverLicenseVerifiedAt?.Add(VerifiedUpdateCooldown),
            LatestRequest = latest is null ? null : ToDto(latest)
        };
    }

    public async Task<DriverLicenseSubmitResponse> SubmitAsync(Stream image, string fileName, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);
        var profile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        var pending = await _verificationRepository.GetPendingByUserIdAsync(userId, cancellationToken);
        if (pending is not null)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_VERIFICATION_PENDING);
        }

        var attemptState = await _attemptLimiter.GetStateAsync(userId, cancellationToken);
        if (attemptState.IsLocked)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_UPLOAD_LOCKED, [
                $"Bạn đã gửi ảnh GPLX không đạt quá nhiều lần. Vui lòng thử lại sau {attemptState.LockedUntil:yyyy-MM-dd HH:mm:ss} UTC."
            ]);
        }

        if (profile.DriverLicenseVerifiedAt.HasValue
            && profile.DriverLicenseVerifiedAt.Value.Add(VerifiedUpdateCooldown) > DateTime.UtcNow)
        {
            throw new AppException(ErrorCode.DRIVER_LICENSE_UPDATE_TOO_SOON, [
                $"GPLX chỉ có thể cập nhật lại sau ngày {profile.DriverLicenseVerifiedAt.Value.Add(VerifiedUpdateCooldown):yyyy-MM-dd HH:mm:ss} UTC."
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
            await _attemptLimiter.RegisterFailureAsync(userId, cancellationToken);
            await LogAsync(userId, null, fileName, aiResult, aiResult.Recommendation, null, null, cancellationToken);
            return new DriverLicenseSubmitResponse
            {
                Status = aiResult.Recommendation,
                Verified = false,
                Message = ToVietnameseMessage(aiResult.Message, aiResult),
                DriverLicenseNumber = aiResult.Extracted.DriverLicenseNumber,
                LicenseClass = aiResult.Extracted.LicenseClass,
                OcrConfidence = aiResult.OcrConfidence,
                Flags = aiResult.Flags
            };
        }

        var request = new VerificationRequest
        {
            UserId = userId,
            Type = VerificationType,
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
        await _attemptLimiter.RegisterAcceptedAsync(userId, cancellationToken);

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
                ApplyVerifiedProfile(profile, request.Id, aiResult);
                _userRepository.UpdateCustomerProfile(profile);
                _verificationRepository.Update(request);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await DeletePreviousVerifiedFileAsync(userId, request.Id, cancellationToken);
            }
            else
            {
                request.Status = "Pending";
                request.DecisionReason = ToVietnameseMessage(aiResult.Message, aiResult, "AI chưa đủ chắc chắn, hồ sơ cần nhân viên kiểm tra.");
                _verificationRepository.Update(request);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            await LogAsync(userId, request.Id, fileName, aiResult, aiResult.Recommendation, upload.PublicId, null, cancellationToken);

            return new DriverLicenseSubmitResponse
            {
                Status = request.Status,
                Verified = request.Status == "Verified",
                Message = request.DecisionReason,
                DriverLicenseNumber = aiResult.Extracted.DriverLicenseNumber,
                LicenseClass = aiResult.Extracted.LicenseClass,
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

    public async Task ApproveAsync(long id, CancellationToken cancellationToken = default)
    {
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

        request.Status = "Verified";
        request.ReviewedBy = reviewerId;
        request.ReviewedAt = DateTime.UtcNow;
        request.DecisionReason = "Nhân viên đã duyệt xác minh GPLX.";
        ApplyVerifiedProfile(profile, request.Id, result);
        _userRepository.UpdateCustomerProfile(profile);
        _verificationRepository.Update(request);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await DeletePreviousVerifiedFileAsync(request.UserId, request.Id, cancellationToken);
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
    }

    private async Task DeletePreviousVerifiedFileAsync(long userId, long currentRequestId, CancellationToken cancellationToken)
    {
        var previous = await _verificationRepository.GetPreviousVerifiedByUserIdAsync(userId, currentRequestId, cancellationToken);
        if (previous is null || string.IsNullOrWhiteSpace(previous.FrontImagePublicId))
        {
            return;
        }

        try
        {
            await _cloudinaryService.DeleteAsync(previous.FrontImagePublicId, cancellationToken);
            previous.DeletedAt = DateTime.UtcNow;
            previous.DecisionReason = $"Đã được thay thế bởi hồ sơ xác minh GPLX #{currentRequestId}.";
            _verificationRepository.Update(previous);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _logService.LogAsync(new DriverLicenseVerificationLogEntry
            {
                UserId = userId,
                VerificationRequestId = previous.Id,
                FilePublicId = previous.FrontImagePublicId,
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

    private static void ApplyVerifiedProfile(CustomerProfile profile, long requestId, DriverLicenseVerificationResult result)
    {
        profile.DriverLicenseNumber = result.Extracted.DriverLicenseNumber;
        profile.DriverLicenseClass = result.Extracted.LicenseClass;
        profile.DriverLicenseVerified = true;
        profile.DriverLicenseVerifiedAt = DateTime.UtcNow;
        profile.DriverLicenseVerificationRequestId = requestId;
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

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}
