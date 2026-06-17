using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class PricingSuggestionService : IPricingSuggestionService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public PricingSuggestionService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<PricingSuggestionDto> SuggestAsync(PricingSuggestionRequest request, CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["Ml:PricingServiceUrl"];
        if (!string.IsNullOrWhiteSpace(baseUrl))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("ml-pricing");
                client.BaseAddress = new Uri(baseUrl);
                var response = await client.PostAsJsonAsync("/suggest-price", request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var dto = await response.Content.ReadFromJsonAsync<PricingSuggestionDto>(cancellationToken: cancellationToken);
                    if (dto is not null)
                        return dto;
                }
            }
            catch
            {
            }
        }

        var multiplier = 1m;
        var day = request.StartDate.DayOfWeek;
        if (day is DayOfWeek.Saturday or DayOfWeek.Sunday)
            multiplier += 0.2m;

        var explanation = multiplier > 1
            ? "Weekend uplift applied by rule-based pricing."
            : "Base daily price retained by rule-based pricing.";

        return new PricingSuggestionDto
        {
            SuggestedPricePerDay = Math.Round(request.BasePricePerDay * multiplier, 0),
            Explanation = explanation
        };
    }
}
