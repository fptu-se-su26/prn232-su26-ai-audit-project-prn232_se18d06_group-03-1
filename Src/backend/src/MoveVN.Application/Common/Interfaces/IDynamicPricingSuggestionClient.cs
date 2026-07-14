using System.Text.Json.Serialization;

namespace MoveVN.Application.Common.Interfaces;

public interface IDynamicPricingSuggestionClient
{
    Task<DynamicPricingSuggestionResult> SuggestAsync(
        DynamicPricingSuggestionRequest request,
        CancellationToken cancellationToken = default);
}

public class DynamicPricingSuggestionRequest
{
    [JsonPropertyName("vehicle_type")]
    public string VehicleType { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public DateOnly Date { get; set; }

    [JsonPropertyName("vacant_rate")]
    public decimal VacantRate { get; set; }

    [JsonPropertyName("base_price")]
    public decimal BasePrice { get; set; }
}

public class DynamicPricingSuggestionResult
{
    [JsonPropertyName("suggested_price")]
    public decimal SuggestedPrice { get; set; }

    [JsonPropertyName("formatted_suggested_price")]
    public string FormattedSuggestedPrice { get; set; } = string.Empty;

    [JsonPropertyName("multiplier")]
    public decimal Multiplier { get; set; }

    [JsonPropertyName("applied_rules")]
    public List<string> AppliedRules { get; set; } = [];

    [JsonPropertyName("is_weekend")]
    public bool IsWeekend { get; set; }

    [JsonPropertyName("is_holiday")]
    public bool IsHoliday { get; set; }

    [JsonPropertyName("is_low_vacancy")]
    public bool IsLowVacancy { get; set; }
}
