namespace MoveVN.Application.Modules.VehiclePricings.DTOs;

public static class PricingModes
{
    public const string Fixed = "Fixed";
    public const string Auto = "Auto";
}

public static class PricingRuleTypes
{
    public const string Multiplier = "Multiplier";
    public const string FixedPrice = "FixedPrice";
}

public class PricingSuggestionResponse
{
    public bool HasSuggestion { get; set; }
    public int ModelId { get; set; }
    public int? AreaId { get; set; }
    public int? PricingRegionId { get; set; }
    public string? PricingRegionCode { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? SuggestedMinPrice { get; set; }
    public decimal? SuggestedMaxPrice { get; set; }
    public decimal? DynamicSuggestedPrice { get; set; }
    public string? DynamicFormattedSuggestedPrice { get; set; }
    public decimal? DynamicPricingMultiplier { get; set; }
    public List<string> DynamicPricingAppliedRules { get; set; } = [];
    public bool? DynamicIsWeekend { get; set; }
    public bool? DynamicIsHoliday { get; set; }
    public bool? DynamicIsLowVacancy { get; set; }
}

public class VehiclePricingResponse
{
    public long VehicleId { get; set; }
    public string PricingMode { get; set; } = string.Empty;
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
    public decimal CurrentPricePerDay { get; set; }
    public DateTime? LastCalculatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; }
    public PricingSuggestionResponse? Suggestion { get; set; }
}

public class UpdateVehiclePricingRequest
{
    public string PricingMode { get; set; } = string.Empty;
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
}
