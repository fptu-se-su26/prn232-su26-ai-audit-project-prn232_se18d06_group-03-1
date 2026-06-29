using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class VehicleRegistrationVerificationService : IVehicleRegistrationVerificationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<VehicleRegistrationVerificationService> _logger;

    public VehicleRegistrationVerificationService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<VehicleRegistrationVerificationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<VehicleRegistrationVerificationResult> VerifyAsync(
        VehicleRegistrationVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["AI_VERIFICATION_BASE_URL"] ?? "http://127.0.0.1:8001";
        var apiKey = _configuration["AI_VERIFICATION_API_KEY"] ?? "dev-ai-verification-key";
        var timeoutSeconds = int.TryParse(_configuration["AI_VERIFICATION_TIMEOUT_SECONDS"], out var timeout) ? timeout : 60;

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var payload = JsonSerializer.Serialize(new
        {
            expectedVehicleType = request.ExpectedVehicleType,
            expectedLicensePlate = request.ExpectedLicensePlate,
            expectedBrand = request.ExpectedBrand,
            expectedModel = request.ExpectedModel,
            fileUrl = request.FileUrl
        });

        using var content = new StringContent(payload, Encoding.UTF8, "application/json");
        using var response = await httpClient.PostAsync($"{baseUrl.TrimEnd('/')}/verify/vehicle-registration", content, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI vehicle verification returned {StatusCode}: {Body}", response.StatusCode, responseBody);
            throw new HttpRequestException($"AI vehicle verification returned HTTP {response.StatusCode}: {responseBody}");
        }

        var result = JsonSerializer.Deserialize<VehicleRegistrationVerificationResult>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("AI vehicle verification returned an empty response.");

        result.RawResponse = responseBody;
        return result;
    }
}
