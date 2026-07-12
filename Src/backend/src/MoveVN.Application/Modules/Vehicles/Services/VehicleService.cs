using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class VehicleService : IVehicleService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IPricingCalculatorService _pricingCalculator;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IVehicleRegistrationVerificationService _vehicleRegistrationVerificationService;
    private readonly IVehicleVerificationLogService _vehicleVerificationLogService;
    private readonly IVehicleDocumentUploadAttemptLimiter _uploadAttemptLimiter;

    public VehicleService(
        IVehicleCatalogRepository repository,
        IPricingCalculatorService pricingCalculator,
        ICloudinaryService cloudinaryService,
        IVehicleRegistrationVerificationService vehicleRegistrationVerificationService,
        IVehicleVerificationLogService vehicleVerificationLogService,
        IVehicleDocumentUploadAttemptLimiter uploadAttemptLimiter)
    {
        _repository = repository;
        _pricingCalculator = pricingCalculator;
        _cloudinaryService = cloudinaryService;
        _vehicleRegistrationVerificationService = vehicleRegistrationVerificationService;
        _vehicleVerificationLogService = vehicleVerificationLogService;
        _uploadAttemptLimiter = uploadAttemptLimiter;
    }

    public async Task<PagedResult<VehicleListItemResponse>> GetMyVehiclesAsync(
        long ownerId, string? type, string? keyword, string? sortBy, int page, int pageSize,
        int? brandId, int? modelId, string? status,
        string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity,
        CancellationToken cancellationToken = default)
        => await _repository.GetOwnerVehiclesAsync(ownerId, type, keyword, sortBy, page, pageSize, brandId, modelId, status, fuelType, seatCount, transmission, bodyType, bikeType, engineCapacity, cancellationToken);

    public async Task<VehicleResponse> GetByIdAsync(long id, long ownerId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.GetVehicleByIdAndOwnerIdAsync(id, ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        var brand = await _repository.GetVehicleBrandByIdAsync(vehicle.BrandId, cancellationToken);
        var model = await _repository.GetVehicleModelByIdAsync(vehicle.ModelId, cancellationToken);
        var variant = vehicle.VariantId.HasValue
            ? await _repository.GetVehicleModelVariantByIdAsync(vehicle.VariantId.Value, cancellationToken)
            : null;
        var area = vehicle.AreaId.HasValue
            ? await _repository.GetAreaByIdAsync(vehicle.AreaId.Value, cancellationToken)
            : null;
        var region = area is not null
            ? await _repository.GetPricingRegionByIdAsync(area.PricingRegionId, cancellationToken)
            : null;
        var pricing = await _repository.GetVehiclePricingByVehicleIdAsync(vehicle.Id, cancellationToken);
        PricingSuggestionResponse? suggestion = null;
        if (vehicle.AreaId.HasValue)
        {
            suggestion = await _pricingCalculator.GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken);
        }

        var images = await _repository.GetVehicleImageResponsesAsync(vehicle.Id, cancellationToken);
        var features = await _repository.GetVehicleFeatureResponsesAsync(vehicle.Id, cancellationToken);
        var documentEntities = await _repository.GetVehicleDocumentsAsync(vehicle.Id, includeDeleted: false, cancellationToken);
        var documents = documentEntities.Select(ToVehicleDocumentResponse).ToList();

        return new VehicleResponse
        {
            Id = vehicle.Id,
            OwnerId = vehicle.OwnerId,
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
            PricingMode = pricing?.PricingMode,
            FixedPricePerDay = pricing?.FixedPricePerDay,
            AutoMinPrice = pricing?.AutoMinPrice,
            AutoMaxPrice = pricing?.AutoMaxPrice,
            CurrentPricePerDay = pricing?.CurrentPricePerDay,
            SuggestedBasePrice = suggestion?.BasePrice,
            SuggestedMinPrice = suggestion?.SuggestedMinPrice,
            SuggestedMaxPrice = suggestion?.SuggestedMaxPrice,
            Status = vehicle.Status,
            RejectionReason = vehicle.RejectionReason,
            FeaturedImage = images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
            Images = images,
            Features = features,
            Documents = documents,
            CreatedAt = vehicle.CreatedAt,
        };
    }

    public async Task<VehicleResponse> CreateAsync(long ownerId, CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(request.DocumentFileUrl))
        {
            await EnsureDocumentUploadAllowedAsync(ownerId, cancellationToken);
        }

        var brand = await _repository.GetVehicleBrandByIdAsync(request.BrandId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        var model = await _repository.GetVehicleModelByIdAsync(request.ModelId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        if (!model.IsActive || !brand.IsActive)
            throw new AppException(ErrorCode.VEHICLE_MODEL_INACTIVE);

        if (NormalizeVehicleType(brand.VehicleType) != NormalizeVehicleType(request.VehicleType))
            throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        if (request.AreaId.HasValue)
        {
            var area = await _repository.GetAreaByIdAsync(request.AreaId.Value, cancellationToken)
                ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);
            if (!area.IsActive)
                throw new AppException(ErrorCode.AREA_NOT_FOUND);
        }

        if (request.VariantId.HasValue)
        {
            var variant = await _repository.GetVehicleModelVariantByIdAsync(request.VariantId.Value, cancellationToken)
                ?? throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);
            if (variant.ModelId != request.ModelId || NormalizeVehicleType(variant.VehicleType) != NormalizeVehicleType(request.VehicleType))
                throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);
        }

        await ValidateFeaturesAsync(request.FeatureIds, request.VehicleType, cancellationToken);
        ValidateDeposit(request.DepositPercent);

        var pricingRequest = BuildPricingRequest(request);
        var vehicleForValidation = new Vehicle
        {
            ModelId = request.ModelId,
            AreaId = request.AreaId
        };
        await _pricingCalculator.ValidatePricingAsync(vehicleForValidation, pricingRequest, cancellationToken);
        var currentPrice = await _pricingCalculator.CalculateCurrentPriceAsync(vehicleForValidation, pricingRequest, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);

        var vehicle = new Vehicle
        {
            OwnerId = ownerId,
            BrandId = request.BrandId,
            ModelId = request.ModelId,
            VariantId = request.VariantId,
            VehicleType = request.VehicleType,
            Year = request.Year,
            LicensePlate = request.LicensePlate,
            OdometerKm = request.OdometerKm,
            Description = request.Description,
            Address = request.Address,
            AreaId = request.AreaId,
            PricePerDay = currentPrice,
            DepositPercent = request.DepositPercent,
            Status = VehicleStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        _repository.Add(vehicle);
        await _repository.SaveChangesAsync(cancellationToken);

        if (request.FeatureIds.Count != 0)
        {
            foreach (var featureId in request.FeatureIds)
            {
                _repository.Add(new VehicleFeatureMapping { VehicleId = vehicle.Id, FeatureId = featureId });
            }
            await _repository.SaveChangesAsync(cancellationToken);
        }

        if (request.ImageUrls.Count != 0)
        {
            for (var i = 0; i < request.ImageUrls.Count; i++)
            {
                _repository.Add(new VehicleImage
                {
                    VehicleId = vehicle.Id,
                    ImageUrl = request.ImageUrls[i],
                    IsPrimary = request.FeaturedImageIndex == i,
                    SortOrder = (byte)i,
                });
            }
            await _repository.SaveChangesAsync(cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(request.DocumentFileUrl))
        {
            var document = new VehicleDocument
            {
                VehicleId = vehicle.Id,
                DocType = "Registration",
                FileUrl = request.DocumentFileUrl,
                IsCurrent = true
            };
            _repository.Add(document);
            await _repository.SaveChangesAsync(cancellationToken);
            await VerifyVehicleDocumentAsync(vehicle, brand.Name, model.Name, document, cancellationToken);
        }

        _repository.Add(new VehiclePricing
        {
            VehicleId = vehicle.Id,
            PricingMode = pricingRequest.PricingMode,
            FixedPricePerDay = pricingRequest.PricingMode == PricingModes.Fixed ? pricingRequest.FixedPricePerDay : null,
            AutoMinPrice = pricingRequest.PricingMode == PricingModes.Auto ? pricingRequest.AutoMinPrice : null,
            AutoMaxPrice = pricingRequest.PricingMode == PricingModes.Auto ? pricingRequest.AutoMaxPrice : null,
            CurrentPricePerDay = currentPrice,
            LastCalculatedAt = pricingRequest.PricingMode == PricingModes.Auto ? DateTime.UtcNow : null,
            LastUpdatedAt = DateTime.UtcNow
        });
        await _repository.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(vehicle.Id, ownerId, cancellationToken);
    }

    public async Task<string> UploadImageAsync(long ownerId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var upload = await _cloudinaryService.UploadAsync(
            fileStream,
            fileName,
            $"movevn/vehicles/{ownerId}/images",
            cancellationToken);

        return upload.Url;
    }

    public async Task<VehicleResponse> UploadDocumentAsync(long id, long ownerId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.GetVehicleByIdAndOwnerIdAsync(id, ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        await EnsureDocumentUploadAllowedAsync(ownerId, cancellationToken);

        var existingCurrentDocuments = await _repository.GetCurrentVehicleDocumentsAsync(vehicle.Id, cancellationToken);
        if (existingCurrentDocuments.Any(document =>
                document.VerificationStatus is VehicleDocumentVerificationStatus.Pending
                    or VehicleDocumentVerificationStatus.ManualReview))
        {
            throw new AppException(ErrorCode.VEHICLE_DOCUMENT_VERIFICATION_PENDING);
        }

        var brand = await _repository.GetVehicleBrandByIdAsync(vehicle.BrandId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        var model = await _repository.GetVehicleModelByIdAsync(vehicle.ModelId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        foreach (var existing in existingCurrentDocuments)
        {
            existing.IsCurrent = false;
        }

        var upload = await _cloudinaryService.UploadAsync(
            fileStream,
            fileName,
            $"movevn/private/vehicles/{ownerId}/{vehicle.Id}/registration",
            cancellationToken);

        var document = new VehicleDocument
        {
            VehicleId = vehicle.Id,
            DocType = "Registration",
            FileUrl = upload.Url,
            FilePublicId = upload.PublicId,
            IsCurrent = true,
            VerificationStatus = VehicleDocumentVerificationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _repository.Add(document);
        await _repository.SaveChangesAsync(cancellationToken);

        await VerifyVehicleDocumentAsync(vehicle, brand.Name, model.Name, document, cancellationToken);

        if (document.VerificationStatus == VehicleDocumentVerificationStatus.Verified)
        {
            await DeleteReplacedDocumentsAsync(vehicle.Id, document.Id, cancellationToken);
        }

        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(vehicle.Id, ownerId, cancellationToken);
    }

    public async Task<VehicleResponse> UpdateAsync(long id, long ownerId, UpdateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.GetVehicleByIdAndOwnerIdAsync(id, ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        vehicle.Year = request.Year;
        vehicle.LicensePlate = request.LicensePlate;
        vehicle.OdometerKm = request.OdometerKm;
        vehicle.Description = request.Description;
        vehicle.Address = request.Address;
        vehicle.AreaId = request.AreaId;
        ValidateDeposit(request.DepositPercent);
        vehicle.DepositPercent = request.DepositPercent;

        if (request.AreaId.HasValue)
        {
            var area = await _repository.GetAreaByIdAsync(request.AreaId.Value, cancellationToken)
                ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);
            if (!area.IsActive)
                throw new AppException(ErrorCode.AREA_NOT_FOUND);
        }

        await _repository.SaveChangesAsync(cancellationToken);

        await ValidateFeaturesAsync(request.FeatureIds, vehicle.VehicleType, cancellationToken);
        var existingMappings = await _repository.GetVehicleFeatureMappingsAsync(vehicle.Id, cancellationToken);
        foreach (var mapping in existingMappings)
        {
            _repository.Remove(mapping);
        }

        foreach (var featureId in request.FeatureIds)
        {
            _repository.Add(new VehicleFeatureMapping { VehicleId = vehicle.Id, FeatureId = featureId });
        }
        await _repository.SaveChangesAsync(cancellationToken);

        var pricing = await _repository.GetVehiclePricingByVehicleIdAsync(vehicle.Id, cancellationToken);
        if (pricing is not null)
        {
            var pricingRequest = new UpdateVehiclePricingRequest
            {
                PricingMode = string.IsNullOrWhiteSpace(pricing.PricingMode) ? PricingModes.Fixed : pricing.PricingMode,
                FixedPricePerDay = pricing.FixedPricePerDay,
                AutoMinPrice = pricing.AutoMinPrice,
                AutoMaxPrice = pricing.AutoMaxPrice
            };
            await _pricingCalculator.ValidatePricingAsync(vehicle, pricingRequest, cancellationToken);
            pricing.CurrentPricePerDay = await _pricingCalculator.CalculateCurrentPriceAsync(vehicle, pricingRequest, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            pricing.LastUpdatedAt = DateTime.UtcNow;
            vehicle.PricePerDay = pricing.CurrentPricePerDay;
            await _repository.SaveChangesAsync(cancellationToken);
        }

        return await GetByIdAsync(vehicle.Id, ownerId, cancellationToken);
    }

    public async Task ToggleStatusAsync(long id, long ownerId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.GetVehicleByIdAndOwnerIdAsync(id, ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        vehicle.Status = vehicle.Status switch
        {
            VehicleStatus.Approved => VehicleStatus.Hidden,
            VehicleStatus.Hidden => VehicleStatus.Approved,
            _ => throw new AppException(ErrorCode.VEHICLE_TOGGLE_INVALID)
        };

        await _repository.SaveChangesAsync(cancellationToken);
    }

    private async Task VerifyVehicleDocumentAsync(
        Vehicle vehicle,
        string brandName,
        string modelName,
        VehicleDocument document,
        CancellationToken cancellationToken)
    {
        var request = new VehicleRegistrationVerificationRequest
        {
            ExpectedVehicleType = NormalizeVehicleType(vehicle.VehicleType),
            ExpectedLicensePlate = vehicle.LicensePlate,
            ExpectedBrand = brandName,
            ExpectedModel = modelName,
            FileUrl = document.FileUrl
        };

        VehicleRegistrationVerificationResult result;
        try
        {
            result = await _vehicleRegistrationVerificationService.VerifyAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            document.Verified = false;
            document.VerificationStatus = VehicleDocumentVerificationStatus.Failed;
            document.VerificationProvider = "AI_VERIFICATION";
            document.ProcessedAt = DateTime.UtcNow;
            document.DecisionReason = ex.Message;
            await _repository.SaveChangesAsync(cancellationToken);

            await _vehicleVerificationLogService.LogAsync(new VehicleVerificationLogEntry
            {
                VehicleId = vehicle.Id,
                VehicleDocumentId = document.Id,
                OwnerId = vehicle.OwnerId,
                Request = request,
                ErrorMessage = ex.Message,
                FilePublicId = document.FilePublicId
            }, cancellationToken);

            return;
        }

        ApplyVerificationResult(vehicle, document, result);
        await _repository.SaveChangesAsync(cancellationToken);

        if (result.Recommendation is "Reject" or "NeedMoreInfo")
        {
            await _uploadAttemptLimiter.RegisterFailureAsync(vehicle.OwnerId, cancellationToken);
        }
        else if (result.Recommendation is "Pass" or "ManualReview")
        {
            await _uploadAttemptLimiter.RegisterAcceptedAsync(vehicle.OwnerId, cancellationToken);
        }

        await _vehicleVerificationLogService.LogAsync(new VehicleVerificationLogEntry
        {
            VehicleId = vehicle.Id,
            VehicleDocumentId = document.Id,
            OwnerId = vehicle.OwnerId,
            Request = request,
            Response = result,
            Recommendation = result.Recommendation,
            Flags = result.Flags,
            OcrConfidence = result.OcrConfidence,
            Message = result.Message,
            FilePublicId = document.FilePublicId
        }, cancellationToken);
    }

    private static void ApplyVerificationResult(
        Vehicle vehicle,
        VehicleDocument document,
        VehicleRegistrationVerificationResult result)
    {
        document.VerificationProvider = "AI_VERIFICATION";
        document.ProcessedAt = DateTime.UtcNow;
        document.OcrLicensePlate = result.Extracted.LicensePlate;
        document.OcrBrand = result.Extracted.Brand;
        document.OcrModel = result.Extracted.Model;
        document.OcrEngineNumber = result.Extracted.EngineNumber;
        document.OcrChassisNumber = result.Extracted.ChassisNumber;
        document.OcrConfidence = result.OcrConfidence;
        document.DecisionReason = result.Message ?? BuildDecisionReason(result);

        switch (result.Recommendation)
        {
            case "Pass":
                document.Verified = true;
                document.VerificationStatus = VehicleDocumentVerificationStatus.Verified;
                document.DecisionReason = null;
                break;
            case "NeedMoreInfo":
                document.Verified = false;
                document.VerificationStatus = VehicleDocumentVerificationStatus.NeedMoreInfo;
                break;
            case "ManualReview":
                document.Verified = false;
                document.VerificationStatus = VehicleDocumentVerificationStatus.ManualReview;
                break;
            case "Reject":
                document.Verified = false;
                document.VerificationStatus = VehicleDocumentVerificationStatus.Rejected;
                vehicle.Status = VehicleStatus.Rejected;
                vehicle.RejectionReason = document.DecisionReason;
                break;
            default:
                document.Verified = false;
                document.VerificationStatus = VehicleDocumentVerificationStatus.Failed;
                break;
        }
    }

    private static string? BuildDecisionReason(VehicleRegistrationVerificationResult result)
    {
        return result.Flags.Count == 0
            ? null
            : string.Join(", ", result.Flags);
    }

    private async Task EnsureDocumentUploadAllowedAsync(long ownerId, CancellationToken cancellationToken)
    {
        var state = await _uploadAttemptLimiter.GetStateAsync(ownerId, cancellationToken);
        if (state.IsLocked)
        {
            throw new AppException(
                ErrorCode.VEHICLE_DOCUMENT_UPLOAD_LOCKED,
                state.LockedUntil.HasValue ? [state.LockedUntil.Value.ToString("O")] : null);
        }
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

    private async Task DeleteReplacedDocumentsAsync(long vehicleId, long currentDocumentId, CancellationToken cancellationToken)
    {
        var oldDocuments = await _repository.GetReplacedVehicleDocumentsForCleanupAsync(vehicleId, currentDocumentId, cancellationToken);

        foreach (var document in oldDocuments)
        {
            try
            {
                await _cloudinaryService.DeleteAsync(document.FilePublicId!, cancellationToken);
                document.DeletedAt = DateTime.UtcNow;
                document.DeleteReason = "Replaced by verified document";

                await _vehicleVerificationLogService.LogAsync(new VehicleVerificationLogEntry
                {
                    VehicleId = document.VehicleId,
                    VehicleDocumentId = document.Id,
                    FilePublicId = document.FilePublicId,
                    FileDeletedAt = document.DeletedAt,
                    DeletionReason = document.DeleteReason
                }, cancellationToken);
            }
            catch
            {
                // Cleanup must not block a verified replacement document.
            }
        }
    }

    private static UpdateVehiclePricingRequest BuildPricingRequest(CreateVehicleRequest request)
    {
        var pricingMode = string.IsNullOrWhiteSpace(request.PricingMode) ? PricingModes.Fixed : request.PricingMode.Trim();
        return new UpdateVehiclePricingRequest
        {
            PricingMode = pricingMode,
            FixedPricePerDay = pricingMode == PricingModes.Fixed ? request.FixedPricePerDay ?? request.PricePerDay : null,
            AutoMinPrice = pricingMode == PricingModes.Auto ? request.AutoMinPrice : null,
            AutoMaxPrice = pricingMode == PricingModes.Auto ? request.AutoMaxPrice : null
        };
    }

    private async Task ValidateFeaturesAsync(IEnumerable<int> featureIds, string vehicleType, CancellationToken cancellationToken)
    {
        var requestedIds = featureIds.ToList();
        var ids = requestedIds.Distinct().ToList();
        if (ids.Count == 0)
            return;

        if (ids.Count != requestedIds.Count)
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);

        var normalizedVehicleType = NormalizeVehicleType(vehicleType);
        var count = await _repository.CountActiveVehicleFeaturesAsync(ids, normalizedVehicleType, cancellationToken);

        if (count != ids.Count)
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);
    }

    private static void ValidateDeposit(int depositPercent)
    {
        if (depositPercent < 0 || depositPercent > 50)
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["Phần trăm tiền cọc phải từ 0 đến 50%."]);
    }

    private static string NormalizeVehicleType(string value)
        => value.Equals("Motorcycle", StringComparison.OrdinalIgnoreCase) ? "Motorbike" : value;
}
