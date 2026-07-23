using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Admin.Services;

public class AdminPostManagementService : IAdminPostManagementService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IPricingCalculatorService _pricingCalculator;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IVehicleRegistrationVerificationService _vehicleRegistrationVerificationService;
    private readonly IVehicleVerificationLogService _vehicleVerificationLogService;

    public AdminPostManagementService(
        IVehicleCatalogRepository repository,
        IPricingCalculatorService pricingCalculator,
        ICloudinaryService cloudinaryService,
        IVehicleRegistrationVerificationService vehicleRegistrationVerificationService,
        IVehicleVerificationLogService vehicleVerificationLogService)
    {
        _repository = repository;
        _pricingCalculator = pricingCalculator;
        _cloudinaryService = cloudinaryService;
        _vehicleRegistrationVerificationService = vehicleRegistrationVerificationService;
        _vehicleVerificationLogService = vehicleVerificationLogService;
    }

    public async Task<AdminPostStatsResponse> GetPostStatsAsync(CancellationToken cancellationToken = default)
    {
        var vehicles = await _repository.Vehicles.AsNoTracking().ToListAsync(cancellationToken);

        var totalVehicles = vehicles.Count;
        var pendingListings = vehicles.Count(v => v.Status == VehicleStatus.Pending);
        var approvedListings = vehicles.Count(v => v.Status == VehicleStatus.Approved);
        var rejectedListings = vehicles.Count(v => v.Status == VehicleStatus.Rejected);

        var ownerIds = vehicles.Select(v => v.OwnerId).Distinct().ToList();
        var totalOwners = await _repository.Vehicles
            .AsNoTracking()
            .Select(v => v.OwnerId)
            .Distinct()
            .CountAsync(cancellationToken);

        var carCount = vehicles.Count(v => v.VehicleType == "Car");
        var motorbikeCount = vehicles.Count(v => v.VehicleType == "Motorbike");

        var vehicleTypeChart = new List<VehicleModerationChartPoint>
        {
            new() { Label = "Ô tô", Value = carCount },
            new() { Label = "Xe máy", Value = motorbikeCount }
        };

        var now = DateTime.UtcNow;
        var monthlyPostStats = new List<MonthlyPostCount>();
        for (var i = 5; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var monthKey = monthDate.ToString("yyyy-MM");
            var count = vehicles.Count(v => v.CreatedAt.ToString("yyyy-MM") == monthKey);
            monthlyPostStats.Add(new MonthlyPostCount
            {
                Month = monthDate.ToString("MM/yyyy"),
                Count = count
            });
        }

        var recentPosts = vehicles
            .OrderByDescending(v => v.CreatedAt)
            .Take(5)
            .ToList();

        var recentOwnerIds = recentPosts.Select(v => v.OwnerId).Distinct().ToList();
        var ownerProfiles = await _repository.Vehicles
            .AsNoTracking()
            .Where(v => recentOwnerIds.Contains(v.OwnerId))
            .GroupBy(v => v.OwnerId)
            .Select(g => new { OwnerId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var brandCache = new Dictionary<int, string>();
        var modelCache = new Dictionary<int, string>();

        var recentItems = new List<AdminPostRecentItem>();
        foreach (var v in recentPosts)
        {
            if (!brandCache.TryGetValue(v.BrandId, out var brandName))
            {
                var brand = await _repository.GetVehicleBrandByIdAsync(v.BrandId, cancellationToken);
                brandName = brand?.Name ?? "";
                brandCache[v.BrandId] = brandName;
            }
            if (!modelCache.TryGetValue(v.ModelId, out var modelName))
            {
                var model = await _repository.GetVehicleModelByIdAsync(v.ModelId, cancellationToken);
                modelName = model?.Name ?? "";
                modelCache[v.ModelId] = modelName;
            }

            recentItems.Add(new AdminPostRecentItem
            {
                Id = v.Id,
                OwnerName = "",
                VehicleType = v.VehicleType,
                BrandName = brandName,
                ModelName = modelName,
                LicensePlate = v.LicensePlate,
                PricePerDay = v.PricePerDay,
                Status = v.Status,
                CreatedAt = v.CreatedAt
            });
        }

        return new AdminPostStatsResponse
        {
            TotalVehicles = totalVehicles,
            PendingListings = pendingListings,
            ApprovedListings = approvedListings,
            RejectedListings = rejectedListings,
            TotalOwners = totalOwners,
            VehicleTypeChart = vehicleTypeChart,
            MonthlyPostStats = monthlyPostStats,
            RecentPosts = recentItems
        };
    }

    public async Task<AdminVehicleOcrPreviewResponse> PreviewVehicleOcrAsync(AdminVehicleOcrPreviewRequest request, CancellationToken cancellationToken = default)
    {
        if (request.CavetImage is null || request.CavetImage.Content.Length == 0)
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["Vui lòng tải lên ảnh cavet xe."]);

        var fileUrl = await _cloudinaryService.UploadAsync(
            new MemoryStream(request.CavetImage.Content),
            request.CavetImage.FileName,
            "movevn/temp/vehicle-ocr",
            cancellationToken);

        var verifyRequest = new VehicleRegistrationVerificationRequest
        {
            ExpectedVehicleType = NormalizeVehicleType(request.VehicleType),
            ExpectedLicensePlate = request.ExpectedLicensePlate,
            ExpectedBrand = request.ExpectedBrand,
            ExpectedModel = request.ExpectedModel,
            FileUrl = fileUrl.Url
        };

        VehicleRegistrationVerificationResult result;
        try
        {
            result = await _vehicleRegistrationVerificationService.VerifyAsync(verifyRequest, cancellationToken);
        }
        catch (Exception ex)
        {
            return new AdminVehicleOcrPreviewResponse
            {
                Success = false,
                Message = $"OCR failed: {ex.Message}"
            };
        }

        return new AdminVehicleOcrPreviewResponse
        {
            Success = true,
            LicensePlate = result.Extracted.LicensePlate,
            Brand = result.Extracted.Brand,
            Model = result.Extracted.Model,
            EngineNumber = result.Extracted.EngineNumber,
            ChassisNumber = result.Extracted.ChassisNumber,
            Confidence = result.OcrConfidence,
            Recommendation = result.Recommendation,
            Flags = result.Flags,
            Message = result.Message
        };
    }

    public async Task<VehicleResponse> CreateVehicleAsync(CreateAdminVehicleRequest request, long adminUserId, CancellationToken cancellationToken = default)
    {
        var ownerExists = await _repository.Vehicles
            .AsNoTracking()
            .AnyAsync(v => v.OwnerId == request.OwnerId, cancellationToken);

        if (!ownerExists)
        {
            var ownerProfile = await _repository.OwnerProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(op => op.UserId == request.OwnerId, cancellationToken);
            if (ownerProfile is null)
                throw new AppException(ErrorCode.VALIDATION_ERROR, ["Chủ xe không tồn tại."]);
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
            OwnerId = request.OwnerId,
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
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            PricePerDay = currentPrice,
            DepositPercent = request.DepositPercent,
            Status = VehicleStatus.Approved,
            ApprovedBy = adminUserId,
            ApprovedAt = DateTime.UtcNow,
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

        return await GetVehicleResponseAsync(vehicle, cancellationToken);
    }

    public async Task<PagedResult<AdminOwnerListItem>> GetOwnersWithVehiclesAsync(string? keyword, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var ownerQuery = _repository.OwnerProfiles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lowerKeyword = keyword.ToLower();
            var matchingUserIds = await _repository.Vehicles
                .AsNoTracking()
                .Select(v => v.OwnerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var users = await _repository.Users
                .AsNoTracking()
                .Where(u => matchingUserIds.Contains(u.Id) &&
                    (u.FullName.ToLower().Contains(lowerKeyword) ||
                     (u.Email != null && u.Email.ToLower().Contains(lowerKeyword))))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            ownerQuery = ownerQuery.Where(op => users.Contains(op.UserId));
        }

        var totalCount = await ownerQuery.CountAsync(cancellationToken);

        var owners = await ownerQuery
            .OrderByDescending(op => op.UserId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ownerUserIds = owners.Select(o => o.UserId).ToList();

        var usersMap = await _repository.Users
            .AsNoTracking()
            .Where(u => ownerUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var vehicleCounts = await _repository.Vehicles
            .AsNoTracking()
            .Where(v => ownerUserIds.Contains(v.OwnerId))
            .GroupBy(v => new { v.OwnerId, v.VehicleType })
            .Select(g => new { g.Key.OwnerId, g.Key.VehicleType, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var items = owners.Select(op =>
        {
            var totalVehicles = vehicleCounts.Where(vc => vc.OwnerId == op.UserId).Sum(vc => vc.Count);
            var carCount = vehicleCounts.Where(vc => vc.OwnerId == op.UserId && vc.VehicleType == "Car").Sum(vc => vc.Count);
            var motorbikeCount = vehicleCounts.Where(vc => vc.OwnerId == op.UserId && vc.VehicleType == "Motorbike").Sum(vc => vc.Count);
            usersMap.TryGetValue(op.UserId, out var user);

            return new AdminOwnerListItem
            {
                UserId = op.UserId,
                FullName = user?.FullName ?? "",
                Email = user?.Email,
                Phone = user?.Phone,
                AvatarUrl = user?.AvatarUrl,
                IsVerified = op.IsVerified,
                TotalVehicles = totalVehicles,
                CarCount = carCount,
                MotorbikeCount = motorbikeCount
            };
        }).ToList();

        return new PagedResult<AdminOwnerListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<PagedResult<AdminOwnerVehicleListItem>> GetOwnerVehiclesAsync(long ownerId, string? vehicleType, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.Vehicles
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId);

        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(v => v.VehicleType == vehicleType);

        var totalCount = await query.CountAsync(cancellationToken);

        var vehicles = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ownerUser = await _repository.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == ownerId, cancellationToken);
        var ownerFullName = ownerUser?.FullName ?? "";

        var items = new List<AdminOwnerVehicleListItem>();
        foreach (var v in vehicles)
        {
            var brand = await _repository.GetVehicleBrandByIdAsync(v.BrandId, cancellationToken);
            var model = await _repository.GetVehicleModelByIdAsync(v.ModelId, cancellationToken);
            var variant = v.VariantId.HasValue
                ? await _repository.GetVehicleModelVariantByIdAsync(v.VariantId.Value, cancellationToken)
                : null;
            var images = await _repository.GetVehicleImageResponsesAsync(v.Id, cancellationToken);

            items.Add(new AdminOwnerVehicleListItem
            {
                Id = v.Id,
                OwnerFullName = ownerFullName,
                VehicleType = v.VehicleType,
                BrandName = brand?.Name ?? "",
                ModelName = model?.Name ?? "",
                VariantName = variant?.Name ?? "",
                Year = v.Year,
                LicensePlate = v.LicensePlate,
                PricePerDay = v.PricePerDay,
                Status = v.Status,
                FeaturedImage = images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl ?? images.FirstOrDefault()?.ImageUrl,
                CreatedAt = v.CreatedAt
            });
        }

        return new PagedResult<AdminOwnerVehicleListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    private async Task<VehicleResponse> GetVehicleResponseAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
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
            suggestion = await _pricingCalculator.GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken: cancellationToken);
        }

        var images = await _repository.GetVehicleImageResponsesAsync(vehicle.Id, cancellationToken);
        var features = await _repository.GetVehicleFeatureResponsesAsync(vehicle.Id, cancellationToken);
        var documentEntities = await _repository.GetVehicleDocumentsAsync(vehicle.Id, includeDeleted: false, cancellationToken);
        var documents = documentEntities.Select(doc => new VehicleDocumentResponse
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
        }).ToList();

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
            Latitude = vehicle.Latitude,
            Longitude = vehicle.Longitude,
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
            return;
        }

        document.VerificationProvider = "AI_VERIFICATION";
        document.ProcessedAt = DateTime.UtcNow;
        document.OcrLicensePlate = result.Extracted.LicensePlate;
        document.OcrBrand = result.Extracted.Brand;
        document.OcrModel = result.Extracted.Model;
        document.OcrEngineNumber = result.Extracted.EngineNumber;
        document.OcrChassisNumber = result.Extracted.ChassisNumber;
        document.OcrConfidence = result.OcrConfidence;
        document.DecisionReason = result.Message;

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
                break;
            default:
                document.Verified = false;
                document.VerificationStatus = VehicleDocumentVerificationStatus.Failed;
                break;
        }

        await _repository.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateFeaturesAsync(IEnumerable<int> featureIds, string vehicleType, CancellationToken cancellationToken)
    {
        var ids = featureIds.Distinct().ToList();
        if (ids.Count == 0) return;

        var normalizedVehicleType = NormalizeVehicleType(vehicleType);
        var count = await _repository.CountActiveVehicleFeaturesAsync(ids, normalizedVehicleType, cancellationToken);
        if (count != ids.Count)
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);
    }

    private static void ValidateDeposit(int depositPercent)
    {
        if (depositPercent < 20 || depositPercent > 50)
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["Phần trăm tiền cọc phải từ 20 đến 50%."]);
    }

    private static string NormalizeVehicleType(string value)
        => value.Equals("Motorcycle", StringComparison.OrdinalIgnoreCase) ? "Motorbike" : value;

    private static UpdateVehiclePricingRequest BuildPricingRequest(CreateAdminVehicleRequest request)
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
}
