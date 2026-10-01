using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Banners.DTOs;
using MoveVN.Application.Modules.Banners.Interfaces;
using MoveVN.Application.Modules.Promotions.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Banners.Services;

public class BannerService : IBannerService
{
    private readonly IBannerRepository _repo;
    private readonly IPromotionRepository _promoRepo;
    private readonly ICloudinaryService _cloudinary;

    public BannerService(
        IBannerRepository repo,
        IPromotionRepository promoRepo,
        ICloudinaryService cloudinary)
    {
        _repo = repo;
        _promoRepo = promoRepo;
        _cloudinary = cloudinary;
    }

    public async Task<BannerResponse> CreateAsync(CreateBannerRequest req, long createdBy, CancellationToken ct = default)
    {
        GuardPopupContent(req.PopupTitle, req.PopupDescription, req.PopupCtaLabel);
        GuardDateRange(req.StartAt, req.EndAt);
        GuardDisplayOrder(req.DisplayOrder);

        if (string.IsNullOrWhiteSpace(req.ImageUrl))
            throw new AppException(ErrorCode.BANNER_IMAGE_REQUIRED);

        Promotion? promotion = await RequireApprovedPromotionAsync(req.PromotionId, ct);

        var entity = new Banner
        {
            Title = req.Title.Trim(),
            ImageUrl = req.ImageUrl.Trim(),
            ImagePublicId = string.IsNullOrWhiteSpace(req.ImagePublicId) ? null : req.ImagePublicId.Trim(),
            PromotionId = req.PromotionId,
            PopupTitle = req.PopupTitle.Trim(),
            PopupDescription = req.PopupDescription.Trim(),
            PopupCtaLabel = req.PopupCtaLabel.Trim(),
            DisplayOrder = req.DisplayOrder,
            IsActive = req.IsActive,
            StartAt = req.StartAt.HasValue ? ToUtc(req.StartAt.Value) : null,
            EndAt = req.EndAt.HasValue ? ToUtc(req.EndAt.Value) : null,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(entity, ct);
        await _repo.SaveChangesAsync(ct);

        return MapToResponse(entity, promotion);
    }

    public async Task<BannerResponse> UpdateAsync(long id, UpdateBannerRequest req, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new AppException(ErrorCode.BANNER_NOT_FOUND);

        var newStartAt = req.ClearStartAt ? (DateTime?)null : req.StartAt ?? entity.StartAt;
        var newEndAt = req.ClearEndAt ? (DateTime?)null : req.EndAt ?? entity.EndAt;
        GuardDateRange(newStartAt, newEndAt);

        if (req.DisplayOrder.HasValue)
            GuardDisplayOrder(req.DisplayOrder.Value);

        Promotion? promotion = entity.PromotionId.HasValue
            ? await _promoRepo.GetByIdAsync(entity.PromotionId.Value, ct)
            : null;

        if (req.ClearPromotion)
        {
            entity.PromotionId = null;
            promotion = null;
        }
        else if (req.PromotionId.HasValue)
        {
            promotion = await RequireApprovedPromotionAsync(req.PromotionId, ct);
            entity.PromotionId = req.PromotionId;
        }

        var effectivePopupTitle = req.PopupTitle ?? entity.PopupTitle;
        var effectivePopupDescription = req.PopupDescription ?? entity.PopupDescription;
        var effectivePopupCtaLabel = req.PopupCtaLabel ?? entity.PopupCtaLabel;
        GuardPopupContent(effectivePopupTitle, effectivePopupDescription, effectivePopupCtaLabel);

        var oldPublicId = entity.ImagePublicId;
        var imageChanged = false;
        string? newPublicId = null;

        if (req.ImageUrl is not null)
        {
            if (string.IsNullOrWhiteSpace(req.ImageUrl))
                throw new AppException(ErrorCode.BANNER_IMAGE_REQUIRED);

            var newUrl = req.ImageUrl.Trim();
            var newPid = string.IsNullOrWhiteSpace(req.ImagePublicId) ? null : req.ImagePublicId.Trim();
            imageChanged = !string.Equals(entity.ImageUrl, newUrl, StringComparison.Ordinal)
                || !string.Equals(entity.ImagePublicId, newPid, StringComparison.Ordinal);
            entity.ImageUrl = newUrl;
            entity.ImagePublicId = newPid;
            newPublicId = newPid;
        }

        if (req.Title is not null) entity.Title = req.Title.Trim();
        if (req.PopupTitle is not null) entity.PopupTitle = req.PopupTitle.Trim();
        if (req.PopupDescription is not null) entity.PopupDescription = req.PopupDescription.Trim();
        if (req.PopupCtaLabel is not null) entity.PopupCtaLabel = req.PopupCtaLabel.Trim();
        if (req.DisplayOrder.HasValue) entity.DisplayOrder = req.DisplayOrder.Value;
        if (req.IsActive.HasValue) entity.IsActive = req.IsActive.Value;
        entity.StartAt = newStartAt.HasValue ? ToUtc(newStartAt.Value) : null;
        entity.EndAt = newEndAt.HasValue ? ToUtc(newEndAt.Value) : null;
        entity.UpdatedAt = DateTime.UtcNow;

        _repo.Update(entity);
        try
        {
            await _repo.SaveChangesAsync(ct);
        }
        catch
        {
            // DB thất bại sau khi client đã upload ảnh mới: cleanup asset mới tránh orphan.
            if (imageChanged && !string.IsNullOrWhiteSpace(newPublicId))
                await TryDeleteImageAsync(newPublicId, ct);
            throw;
        }

        // DB đã lưu: xóa ảnh cũ best-effort, không để lỗi Cloudinary làm fail request.
        if (imageChanged && !string.IsNullOrWhiteSpace(oldPublicId)
            && !string.Equals(oldPublicId, entity.ImagePublicId, StringComparison.Ordinal))
        {
            await TryDeleteImageAsync(oldPublicId, ct);
        }

        return MapToResponse(entity, promotion);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new AppException(ErrorCode.BANNER_NOT_FOUND);

        var publicId = entity.ImagePublicId;

        // Xóa DB trước: không để lỗi external service làm mất DB record.
        _repo.Remove(entity);
        await _repo.SaveChangesAsync(ct);

        if (!string.IsNullOrWhiteSpace(publicId))
            await TryDeleteImageAsync(publicId, ct);

        return true;
    }

    public async Task<bool> ToggleActiveAsync(long id, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new AppException(ErrorCode.BANNER_NOT_FOUND);

        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        _repo.Update(entity);
        await _repo.SaveChangesAsync(ct);
        return entity.IsActive;
    }

    public async Task<BannerResponse?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(id, ct);
        if (entity is null)
            return null;

        Promotion? promotion = entity.PromotionId.HasValue
            ? await _promoRepo.GetByIdAsync(entity.PromotionId.Value, ct)
            : null;

        return MapToResponse(entity, promotion);
    }

    public async Task<PagedResult<BannerResponse>> GetListAsync(
        string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var total = await _repo.GetListCountAsync(keyword, isActive, ct);
        var items = await _repo.GetListAsync(keyword, isActive, page, pageSize, ct);

        var responses = new List<BannerResponse>(items.Count);
        foreach (var item in items)
        {
            Promotion? promotion = item.PromotionId.HasValue
                ? await _promoRepo.GetByIdAsync(item.PromotionId.Value, ct)
                : null;
            responses.Add(MapToResponse(item, promotion));
        }

        return new PagedResult<BannerResponse>
        {
            Items = responses,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<List<HomepageBannerItem>> GetHomepageAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var items = await _repo.GetHomepageVisibleAsync(now, ct);

        // Batch-load promotions trong 1 query, tránh N+1 roundtrip.
        var promoIds = items
            .Where(i => i.PromotionId.HasValue)
            .Select(i => i.PromotionId!.Value)
            .Distinct()
            .ToList();
        var promotions = promoIds.Count > 0
            ? (await _promoRepo.GetByIdsAsync(promoIds, ct)).ToDictionary(p => p.Id)
            : new Dictionary<long, Promotion>();

        var result = new List<HomepageBannerItem>(items.Count);
        foreach (var item in items)
        {
            promotions.TryGetValue(item.PromotionId ?? 0, out var promotion);

            result.Add(new HomepageBannerItem
            {
                Id = item.Id,
                Title = item.Title,
                ImageUrl = item.ImageUrl,
                PromotionId = item.PromotionId,
                PromotionCode = promotion?.Code,
                PromotionName = promotion?.Name,
                DiscountType = promotion?.DiscountType,
                DiscountValue = promotion?.DiscountValue,
                VehicleType = promotion?.VehicleType,
                EndAt = promotion?.EndAt,
                PopupTitle = item.PopupTitle,
                PopupDescription = item.PopupDescription,
                PopupCtaLabel = item.PopupCtaLabel,
                DisplayOrder = item.DisplayOrder,
            });
        }

        return result;
    }

    private async Task<Promotion?> RequireApprovedPromotionAsync(long? promotionId, CancellationToken ct)
    {
        if (!promotionId.HasValue)
            return null;

        var promotion = await _promoRepo.GetByIdAsync(promotionId.Value, ct)
            ?? throw new AppException(ErrorCode.BANNER_PROMOTION_NOT_FOUND);

        if (promotion.ApprovalStatus != "Approved")
            throw new AppException(ErrorCode.BANNER_PROMOTION_NOT_APPROVED);

        return promotion;
    }

    private static void GuardPopupContent(string? popupTitle, string? popupDescription, string? popupCtaLabel)
    {
        if (string.IsNullOrWhiteSpace(popupTitle))
            throw new AppException(ErrorCode.BANNER_POPUP_TITLE_REQUIRED);

        if (string.IsNullOrWhiteSpace(popupDescription))
            throw new AppException(ErrorCode.BANNER_POPUP_DESCRIPTION_REQUIRED);

        if (string.IsNullOrWhiteSpace(popupCtaLabel))
            throw new AppException(ErrorCode.BANNER_POPUP_CTA_LABEL_REQUIRED);
    }

    private static void GuardDateRange(DateTime? startAt, DateTime? endAt)
    {
        if (!BannerRules.IsValidDateRange(startAt, endAt))
            throw new AppException(ErrorCode.BANNER_DATE_RANGE_INVALID);
    }

    private static void GuardDisplayOrder(int displayOrder)
    {
        if (displayOrder < 0)
            throw new AppException(ErrorCode.BANNER_DISPLAY_ORDER_INVALID);
    }

    private async Task TryDeleteImageAsync(string publicId, CancellationToken ct)
    {
        try
        {
            await _cloudinary.DeleteAsync(publicId, ct);
        }
        catch
        {
            // Best-effort: không để lỗi Cloudinary làm fail nghiệp vụ Banner.
        }
    }

    private static DateTime ToUtc(DateTime value)
        => value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();

    private static BannerResponse MapToResponse(Banner entity, Promotion? promotion)
        => new()
        {
            Id = entity.Id,
            Title = entity.Title,
            ImageUrl = entity.ImageUrl,
            ImagePublicId = entity.ImagePublicId,
            PromotionId = entity.PromotionId,
            PromotionCode = promotion?.Code,
            PromotionName = promotion?.Name,
            PopupTitle = entity.PopupTitle,
            PopupDescription = entity.PopupDescription,
            PopupCtaLabel = entity.PopupCtaLabel,
            DisplayOrder = entity.DisplayOrder,
            IsActive = entity.IsActive,
            StartAt = entity.StartAt,
            EndAt = entity.EndAt,
            CreatedBy = entity.CreatedBy,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
}
