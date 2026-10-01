namespace MoveVN.Domain.Entities;

public class Banner
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? ImagePublicId { get; set; }
    public long? PromotionId { get; set; }
    // Legacy columns retained in database only (popup-only flow does not use them):
    // TargetUrl, ClickAction, PopupCtaUrl. They are intentionally excluded
    // from DTOs/validators/service mapping below.
    public string TargetUrl { get; set; } = string.Empty;
    public string ClickAction { get; set; } = "Link";
    public string PopupTitle { get; set; } = string.Empty;
    public string PopupDescription { get; set; } = string.Empty;
    public string PopupCtaLabel { get; set; } = "Nhận voucher";
    public string? PopupCtaUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
