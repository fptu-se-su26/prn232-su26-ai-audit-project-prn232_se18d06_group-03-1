namespace MoveVN.Application.Modules.Banners.Services;

public static class BannerRules
{
    public const string DefaultPopupCtaLabel = "Nhận voucher";

    public static bool IsValidDateRange(DateTime? startAt, DateTime? endAt)
    {
        if (!startAt.HasValue || !endAt.HasValue)
            return true;

        return startAt.Value < endAt.Value;
    }

    public static bool IsVisible(bool isActive, DateTime? startAt, DateTime? endAt, DateTime now)
    {
        if (!isActive)
            return false;

        if (startAt.HasValue && startAt.Value > now)
            return false;

        if (endAt.HasValue && endAt.Value < now)
            return false;

        return true;
    }
}
