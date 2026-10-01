namespace MoveVN.Application.Modules.Banners.DTOs;

public class CreateBannerRequest
{
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? ImagePublicId { get; set; }
    public long? PromotionId { get; set; }
    public string PopupTitle { get; set; } = string.Empty;
    public string PopupDescription { get; set; } = string.Empty;
    public string PopupCtaLabel { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
}

public class UpdateBannerRequest
{
    public string? Title { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImagePublicId { get; set; }
    public long? PromotionId { get; set; }
    public bool ClearPromotion { get; set; }
    public string? PopupTitle { get; set; }
    public string? PopupDescription { get; set; }
    public string? PopupCtaLabel { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? StartAt { get; set; }
    public bool ClearStartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public bool ClearEndAt { get; set; }
}

public class BannerResponse
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? ImagePublicId { get; set; }
    public long? PromotionId { get; set; }
    public string? PromotionCode { get; set; }
    public string? PromotionName { get; set; }
    public string PopupTitle { get; set; } = string.Empty;
    public string PopupDescription { get; set; } = string.Empty;
    public string PopupCtaLabel { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class HomepageBannerItem
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public long? PromotionId { get; set; }
    public string? PromotionCode { get; set; }
    public string? PromotionName { get; set; }
    public string? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public string? VehicleType { get; set; }
    public DateTime? EndAt { get; set; }
    public string PopupTitle { get; set; } = string.Empty;
    public string PopupDescription { get; set; } = string.Empty;
    public string PopupCtaLabel { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
