using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class DynamicPricingSuggestionClient : IDynamicPricingSuggestionClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DynamicPricingSuggestionClient> _logger;

    public DynamicPricingSuggestionClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DynamicPricingSuggestionClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DynamicPricingSuggestionResult> SuggestAsync(
        DynamicPricingSuggestionRequest request,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["PYTHON_API_BASE_URL"] ?? "http://127.0.0.1:8000";
        var timeoutSeconds = int.TryParse(_configuration["PYTHON_API_TIMEOUT_SECONDS"], out var timeout) ? timeout : 10;

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);

        using var response = await httpClient.PostAsJsonAsync(
            $"{baseUrl.TrimEnd('/')}/suggest-price",
            request,
            cancellationToken);

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Dynamic pricing suggestion returned {StatusCode}: {Body}", response.StatusCode, responseBody);
            throw new HttpRequestException($"Dynamic pricing suggestion returned HTTP {response.StatusCode}: {responseBody}");
        }

        return JsonSerializer.Deserialize<DynamicPricingSuggestionResult>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("Dynamic pricing suggestion returned an empty response.");
    }
}
