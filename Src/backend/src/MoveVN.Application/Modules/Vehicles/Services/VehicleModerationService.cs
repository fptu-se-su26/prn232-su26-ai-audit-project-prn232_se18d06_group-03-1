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
    private readonly ICurrentUserContext _currentUserContext;

    public VehicleModerationService(
        IVehicleCatalogRepository repository,
        IUserRepository userRepository,
        IVehicleVerificationLogQueryService logQueryService,
        ICurrentUserContext currentUserContext)
    {
        _repository = repository;
        _userRepository = userRepository;
        _logQueryService = logQueryService;
        _currentUserContext = currentUserContext;
    }

    public async Task<PagedResult<VehicleModerationListItem>> GetVehiclesAsync(
        string? status,
        string? documentStatus,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.Vehicles.AsQueryable();

        var statuses = status?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        if (statuses is { Count: > 0 })
        {
            query = query.Where(vehicle => statuses.Contains(vehicle.Status));
        }

        var documentStatuses = documentStatus?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => Enum.TryParse<VehicleDocumentVerificationStatus>(value, true, out var parsedStatus)
                ? parsedStatus
                : (VehicleDocumentVerificationStatus?)null)
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .ToList();

        if (documentStatuses is { Count: > 0 })
        {
            query = query.Where(vehicle => _repository.VehicleDocuments.Any(doc =>
                doc.VehicleId == vehicle.Id && doc.IsCurrent && documentStatuses.Contains(doc.VerificationStatus)));
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(vehicle => vehicle.LicensePlate.ToLower().Contains(kw)
                || vehicle.Description != null && vehicle.Description.ToLower().Contains(kw));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var vehicles = await query
            .OrderByDescending(vehicle => vehicle.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var vehicleIds = vehicles.Select(vehicle => vehicle.Id).ToList();
        var ownerIds = vehicles.Select(vehicle => vehicle.OwnerId).Distinct().ToList();
        var brandIds = vehicles.Select(vehicle => vehicle.BrandId).Distinct().ToList();
        var modelIds = vehicles.Select(vehicle => vehicle.ModelId).Distinct().ToList();
        var currentDocuments = await _repository.VehicleDocuments
            .Where(doc => vehicleIds.Contains(doc.VehicleId) && doc.IsCurrent)
            .ToListAsync(cancellationToken);
        var brands = await _repository.VehicleBrands
            .Where(brand => brandIds.Contains(brand.Id))
            .ToDictionaryAsync(brand => brand.Id, brand => brand.Name, cancellationToken);
        var models = await _repository.VehicleModels
            .Where(model => modelIds.Contains(model.Id))
            .ToDictionaryAsync(model => model.Id, model => model.Name, cancellationToken);
        var owners = new Dictionary<long, string>();
        foreach (var ownerId in ownerIds)
        {
            var owner = await _userRepository.GetByIdAsync(ownerId, cancellationToken);
            owners[ownerId] = owner?.FullName ?? "";
        }

        var items = vehicles.Select(vehicle =>
        {
            var document = currentDocuments.FirstOrDefault(doc => doc.VehicleId == vehicle.Id);
            return new VehicleModerationListItem
            {
                Id = vehicle.Id,
                OwnerId = vehicle.OwnerId,
                OwnerName = owners.GetValueOrDefault(vehicle.OwnerId) ?? "",
                BrandName = brands.GetValueOrDefault(vehicle.BrandId) ?? "",
                ModelName = models.GetValueOrDefault(vehicle.ModelId) ?? "",
                VehicleType = vehicle.VehicleType,
                Year = vehicle.Year,
                LicensePlate = vehicle.LicensePlate,
                PricePerDay = vehicle.PricePerDay,
                Status = vehicle.Status,
                DocumentStatus = document?.VerificationStatus.ToString(),
                DocumentVerified = document?.Verified ?? false,
                CreatedAt = vehicle.CreatedAt
            };
        }).ToList();

        return new PagedResult<VehicleModerationListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<VehicleModerationDetailResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.Vehicles.FirstOrDefaultAsync(vehicle => vehicle.Id == id, cancellationToken)
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

        var images = await _repository.VehicleImages
            .Where(image => image.VehicleId == vehicle.Id)
            .OrderBy(image => image.SortOrder)
            .Select(image => new VehicleImageResponse
            {
                Id = image.Id,
                ImageUrl = image.ImageUrl,
                IsPrimary = image.IsPrimary,
                SortOrder = image.SortOrder
            })
            .ToListAsync(cancellationToken);

        var documentEntities = await _repository.VehicleDocuments
            .Where(doc => doc.VehicleId == vehicle.Id && doc.DeletedAt == null)
            .OrderByDescending(doc => doc.IsCurrent)
            .ThenByDescending(doc => doc.CreatedAt)
            .ToListAsync(cancellationToken);
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
            Status = vehicle.Status,
            RejectionReason = vehicle.RejectionReason,
            FeaturedImage = images.FirstOrDefault(image => image.IsPrimary)?.ImageUrl,
            Images = images,
            Features = [],
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
                CreatedAt = log.CreatedAt
            }).ToList(),
            CreatedAt = vehicle.CreatedAt
        };
    }

    public async Task ApproveDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken = default)
    {
        var document = await GetDocumentAsync(vehicleId, documentId, cancellationToken);
        document.Verified = true;
        document.VerificationStatus = VehicleDocumentVerificationStatus.Verified;
        document.ProcessedAt = DateTime.UtcNow;
        document.DecisionReason = null;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task RejectDocumentAsync(long vehicleId, long documentId, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);

        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        var document = await GetDocumentAsync(vehicleId, documentId, cancellationToken);

        document.Verified = false;
        document.VerificationStatus = VehicleDocumentVerificationStatus.Rejected;
        document.ProcessedAt = DateTime.UtcNow;
        document.DecisionReason = reason;
        vehicle.Status = VehicleStatus.Rejected;
        vehicle.RejectionReason = reason;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task RequestMoreInfoAsync(long vehicleId, long documentId, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);

        var document = await GetDocumentAsync(vehicleId, documentId, cancellationToken);
        document.Verified = false;
        document.VerificationStatus = VehicleDocumentVerificationStatus.NeedMoreInfo;
        document.ProcessedAt = DateTime.UtcNow;
        document.DecisionReason = reason;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task ApproveListingAsync(long vehicleId, bool allowOverride, CancellationToken cancellationToken = default)
    {
        var vehicle = await GetVehicleAsync(vehicleId, cancellationToken);
        var hasVerifiedDocument = await _repository.VehicleDocuments.AnyAsync(doc =>
            doc.VehicleId == vehicle.Id
            && doc.IsCurrent
            && doc.Verified
            && doc.VerificationStatus == VehicleDocumentVerificationStatus.Verified,
            cancellationToken);

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
        return await _repository.Vehicles.FirstOrDefaultAsync(vehicle => vehicle.Id == vehicleId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);
    }

    private async Task<VehicleDocument> GetDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken)
    {
        return await _repository.VehicleDocuments.FirstOrDefaultAsync(doc => doc.Id == documentId && doc.VehicleId == vehicleId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_DOCUMENT_NOT_FOUND);
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
