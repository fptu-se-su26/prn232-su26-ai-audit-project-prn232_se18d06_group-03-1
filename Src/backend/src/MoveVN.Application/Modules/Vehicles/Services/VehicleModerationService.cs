using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class VehicleModerationService : IVehicleModerationService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IUserRepository _userRepository;
    private readonly IVehicleVerificationLogQueryService _logQueryService;
    private readonly IVehicleVerificationLogService _logService;
    private readonly IVehicleDocumentUploadAttemptLimiter _uploadAttemptLimiter;
    private readonly ICurrentUserContext _currentUserContext;

    public VehicleModerationService(
        IVehicleCatalogRepository repository,
        IUserRepository userRepository,
        IVehicleVerificationLogQueryService logQueryService,
        IVehicleVerificationLogService logService,
        IVehicleDocumentUploadAttemptLimiter uploadAttemptLimiter,
        ICurrentUserContext currentUserContext)
    {
        _repository = repository;
        _userRepository = userRepository;
        _logQueryService = logQueryService;
        _logService = logService;
        _uploadAttemptLimiter = uploadAttemptLimiter;
        _currentUserContext = currentUserContext;
    }

    public async Task<PagedResult<VehicleModerationListItem>> GetVehiclesAsync(
        string? status,
        string? documentStatus,
        string? keyword,
        string? vehicleType,
        int? brandId,
        int? modelId,
        string? fuelType,
        string? seatCount,
        string? transmission,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var statuses = status?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        var documentStatuses = documentStatus?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => Enum.TryParse<VehicleDocumentVerificationStatus>(value, true, out var parsedStatus)
                ? parsedStatus
                : (VehicleDocumentVerificationStatus?)null)
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .ToList();

        var result = await _repository.GetModerationVehiclesAsync(statuses, documentStatuses, keyword, vehicleType, brandId, modelId, fuelType, seatCount, transmission, page, pageSize, cancellationToken);
        var ownerIds = result.Items.Select(vehicle => vehicle.OwnerId).Distinct().ToList();
        var owners = new Dictionary<long, string>();
        foreach (var ownerId in ownerIds)
        {
            var owner = await _userRepository.GetByIdAsync(ownerId, cancellationToken);
            owners[ownerId] = owner?.FullName ?? "";
        }

        foreach (var item in result.Items)
        {
            item.OwnerName = owners.GetValueOrDefault(item.OwnerId) ?? "";
        }

        return result;
    }

    public async Task<VehicleModerationOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var listingStatusCounts = await _repository.Vehicles
            .GroupBy(vehicle => vehicle.Status)
            .Select(group => new VehicleModerationChartPoint
            {
                Label = group.Key,
                Value = group.Count()
            })
            .ToListAsync(cancellationToken);

        var currentDocuments = _repository.VehicleDocuments
            .Where(document => document.IsCurrent && document.DeletedAt == null);

        var documentStatusCounts = await currentDocuments
            .GroupBy(document => document.VerificationStatus)
            .Select(group => new VehicleModerationChartPoint
            {
                Label = group.Key.ToString(),
                Value = group.Count()
            })
            .ToListAsync(cancellationToken);

        var vehicleTypeCounts = await _repository.Vehicles
            .GroupBy(vehicle => vehicle.VehicleType)
            .Select(group => new VehicleModerationChartPoint
            {
                Label = group.Key,
                Value = group.Count()
            })
            .ToListAsync(cancellationToken);

        int ListingCount(string status)
            => listingStatusCounts.FirstOrDefault(item => item.Label == status)?.Value ?? 0;

        int DocumentCount(VehicleDocumentVerificationStatus status)
            => documentStatusCounts.FirstOrDefault(item => item.Label == status.ToString())?.Value ?? 0;

        var overrideCandidates = await _repository.Vehicles
            .Where(vehicle => vehicle.Status == VehicleStatus.Pending)
            .CountAsync(vehicle => !_repository.VehicleDocuments.Any(document =>
                document.VehicleId == vehicle.Id
                && document.IsCurrent
                && document.Verified
                && document.VerificationStatus == VehicleDocumentVerificationStatus.Verified), cancellationToken);

        var listingStatusChart = new[]
        {
            VehicleStatus.Pending,
            VehicleStatus.Approved,
            VehicleStatus.Rejected,
            VehicleStatus.Hidden
        }
            .Select(status => new VehicleModerationChartPoint
            {
                Label = status,
                Value = ListingCount(status)
            })
            .ToList();

        var documentStatusChart = Enum.GetValues<VehicleDocumentVerificationStatus>()
            .Select(status => new VehicleModerationChartPoint
            {
                Label = status.ToString(),
                Value = DocumentCount(status)
            })
            .ToList();

        return new VehicleModerationOverviewResponse
        {
            TotalVehicles = await _repository.Vehicles.CountAsync(cancellationToken),
            PendingListings = ListingCount(VehicleStatus.Pending),
            ApprovedListings = ListingCount(VehicleStatus.Approved),
            RejectedListings = ListingCount(VehicleStatus.Rejected),
            PendingDocuments = DocumentCount(VehicleDocumentVerificationStatus.Pending),
            VerifiedDocuments = DocumentCount(VehicleDocumentVerificationStatus.Verified),
            ManualReviewDocuments = DocumentCount(VehicleDocumentVerificationStatus.ManualReview),
            NeedMoreInfoDocuments = DocumentCount(VehicleDocumentVerificationStatus.NeedMoreInfo),
            RejectedDocuments = DocumentCount(VehicleDocumentVerificationStatus.Rejected),
            FailedDocuments = DocumentCount(VehicleDocumentVerificationStatus.Failed),
            OverrideCandidates = overrideCandidates,
            ListingStatusChart = listingStatusChart,
            DocumentStatusChart = documentStatusChart,
            VehicleTypeChart = vehicleTypeCounts.OrderByDescending(item => item.Value).ToList()
        };
    }

    public async Task<VehicleModerationDetailResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.GetVehicleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        var brand = await _repository.GetVehicleBrandByIdAsync(vehicle.BrandId, cancellationToken);
        var model = await _repository.GetVehicleModelByIdAsync(vehicle.ModelId, cancellationToken);
        var variant = vehicle.VariantId.HasValue
            ? await _repository.GetVehicleModelVariantByIdAsync(vehicle.VariantId.Value, cancellationToken)
            : null;
        var owner = await _userRepository.GetByIdAsync(vehicle.OwnerId, cancellationToken);
        var area = vehicle.AreaId.HasValue
            ? await _repository.GetAreaByIdAsync(vehicle.AreaId.Value, cancellationToken)
            : null;
        var region = area is not null
            ? await _repository.GetPricingRegionByIdAsync(area.PricingRegionId, cancellationToken)
            : null;

        var images = await _repository.GetVehicleImageResponsesAsync(vehicle.Id, cancellationToken);
        var features = await _repository.GetVehicleFeatureResponsesAsync(vehicle.Id, cancellationToken);
        var documentEntities = await _repository.GetVehicleDocumentsAsync(vehicle.Id, includeDeleted: false, cancellationToken);
        var documents = documentEntities.Select(ToVehicleDocumentResponse).ToList();

        var logs = await _logQueryService.GetByVehicleIdAsync(vehicle.Id, cancellationToken);

        return new VehicleModerationDetailResponse
        {
            Id = vehicle.Id,
            OwnerId = vehicle.OwnerId,
            OwnerName = owner?.FullName ?? "",
            BrandId = vehicle.BrandId,
            BrandName = brand?.Name ?? "",
            ModelId = vehicle.ModelId,
            ModelName = model?.Name ?? "",
            VariantId = vehicle.VariantId,
            VariantName = variant?.Name,
            VehicleType = vehicle.VehicleType,
            Year = vehicle.Year,
            LicensePlate = vehicle.LicensePlate,
            OdometerKm = vehicle.OdometerKm,
            Description = vehicle.Description,
            Address = vehicle.Address,
            AreaId = vehicle.AreaId,
            AreaName = area is not null ? $"{area.Province} - {area.District}" : null,
            PricingRegionId = area?.PricingRegionId,
            PricingRegionCode = region?.Code,
            PricePerDay = vehicle.PricePerDay,
            DepositPercent = vehicle.DepositPercent,
            SecurityRequiresDeposit = vehicle.SecurityRequiresDeposit,
            SecurityDepositAmount = vehicle.SecurityDepositAmount,
            Status = vehicle.Status,
            RejectionReason = vehicle.RejectionReason,
            FeaturedImage = images.FirstOrDefault(image => image.IsPrimary)?.ImageUrl,
            Images = images,
            Features = features,
            Documents = documents,
            VerificationLogs = logs.Select(log => new VehicleVerificationLogResponse
            {
                Id = log.Id,
                VehicleId = log.VehicleId,
                VehicleDocumentId = log.VehicleDocumentId,
                Recommendation = log.Recommendation,
                Flags = log.Flags,
                OcrConfidence = log.OcrConfidence,
                Message = log.Message,
                ErrorMessage = log.ErrorMessage,
                Provider = log.Provider,
                Action = log.Action,
                ActorUserId = log.ActorUserId,
                CreatedAt = log.CreatedAt
            }).ToList(),
            CreatedAt = vehicle.CreatedAt
        };
    }

    public async Task ApproveDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken = default)
    {
        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        var document = await GetDocumentAsync(vehicleId, documentId, cancellationToken);
        document.Verified = true;
        document.VerificationStatus = VehicleDocumentVerificationStatus.Verified;
        document.VerificationProvider = "MANUAL_REVIEW";
        document.ProcessedAt = DateTime.UtcNow;
        document.DecisionReason = null;
        await _repository.SaveChangesAsync(cancellationToken);
        await _uploadAttemptLimiter.RegisterAcceptedAsync(vehicle.OwnerId, cancellationToken);
        await LogManualDecisionAsync(vehicle, document, "Approve", "Pass", "Nhân viên đã duyệt cà vẹt xe.", cancellationToken);
    }

    public async Task RejectDocumentAsync(long vehicleId, long documentId, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);

        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        var document = await GetDocumentAsync(vehicleId, documentId, cancellationToken);

        document.Verified = false;
        document.VerificationStatus = VehicleDocumentVerificationStatus.Rejected;
        document.VerificationProvider = "MANUAL_REVIEW";
        document.ProcessedAt = DateTime.UtcNow;
        document.DecisionReason = reason;
        vehicle.Status = VehicleStatus.Rejected;
        vehicle.RejectionReason = reason;
        await _repository.SaveChangesAsync(cancellationToken);
        await _uploadAttemptLimiter.RegisterFailureAsync(vehicle.OwnerId, cancellationToken);
        await LogManualDecisionAsync(vehicle, document, "Reject", "Reject", reason.Trim(), cancellationToken);
    }

    public async Task RequestMoreInfoAsync(long vehicleId, long documentId, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);

        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        var document = await GetDocumentAsync(vehicleId, documentId, cancellationToken);
        document.Verified = false;
        document.VerificationStatus = VehicleDocumentVerificationStatus.NeedMoreInfo;
        document.VerificationProvider = "MANUAL_REVIEW";
        document.ProcessedAt = DateTime.UtcNow;
        document.DecisionReason = reason;
        await _repository.SaveChangesAsync(cancellationToken);
        await _uploadAttemptLimiter.RegisterFailureAsync(vehicle.OwnerId, cancellationToken);
        await LogManualDecisionAsync(vehicle, document, "RequestMoreInfo", "NeedMoreInfo", reason.Trim(), cancellationToken);
    }

    public async Task ApproveListingAsync(long vehicleId, bool allowOverride, CancellationToken cancellationToken = default)
    {
        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        var hasVerifiedDocument = await _repository.HasVerifiedCurrentDocumentAsync(vehicle.Id, cancellationToken);

        if (!hasVerifiedDocument && !allowOverride)
        {
            throw new AppException(ErrorCode.VEHICLE_DOCUMENT_NOT_VERIFIED);
        }

        vehicle.Status = VehicleStatus.Approved;
        vehicle.ApprovedAt = DateTime.UtcNow;
        vehicle.ApprovedBy = _currentUserContext.UserId;
        vehicle.RejectionReason = null;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task RejectListingAsync(long vehicleId, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);

        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        vehicle.Status = VehicleStatus.Rejected;
        vehicle.RejectionReason = reason;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private async Task<Vehicle> GetVehicleAsync(long vehicleId, CancellationToken cancellationToken)
    {
        return await _repository.GetVehicleByIdAsync(vehicleId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);
    }

    private async Task<VehicleDocument> GetDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken)
    {
        return await _repository.GetVehicleDocumentAsync(vehicleId, documentId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_DOCUMENT_NOT_FOUND);
    }

    private Task LogManualDecisionAsync(
        Vehicle vehicle,
        VehicleDocument document,
        string action,
        string recommendation,
        string message,
        CancellationToken cancellationToken)
    {
        return _logService.LogAsync(new VehicleVerificationLogEntry
        {
            VehicleId = vehicle.Id,
            VehicleDocumentId = document.Id,
            OwnerId = vehicle.OwnerId,
            Provider = "MANUAL_REVIEW",
            Action = action,
            ActorUserId = _currentUserContext.UserId,
            Recommendation = recommendation,
            Message = message,
            FilePublicId = document.FilePublicId,
            Response = new
            {
                Status = document.VerificationStatus.ToString(),
                document.Verified,
                Reason = document.DecisionReason
            }
        }, cancellationToken);
    }

    private static VehicleDocumentResponse ToVehicleDocumentResponse(VehicleDocument doc)
    {
        return new VehicleDocumentResponse
        {
            Id = doc.Id,
            DocType = doc.DocType,
            FileUrl = doc.FileUrl,
            ExpiryDate = doc.ExpiryDate,
            Verified = doc.Verified,
            IsCurrent = doc.IsCurrent,
            VerificationStatus = doc.VerificationStatus.ToString(),
            VerificationProvider = doc.VerificationProvider,
            ProcessedAt = doc.ProcessedAt,
            DecisionReason = doc.DecisionReason,
            OcrLicensePlate = doc.OcrLicensePlate,
            OcrBrand = doc.OcrBrand,
            OcrModel = doc.OcrModel,
            OcrEngineNumber = doc.OcrEngineNumber,
            OcrChassisNumber = doc.OcrChassisNumber,
            OcrConfidence = doc.OcrConfidence,
            CreatedAt = doc.CreatedAt
        };
    }
}
