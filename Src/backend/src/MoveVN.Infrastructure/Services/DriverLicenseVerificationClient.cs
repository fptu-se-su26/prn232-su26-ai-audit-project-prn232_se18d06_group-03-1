using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class DriverLicenseVerificationClient : IDriverLicenseVerificationClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DriverLicenseVerificationClient> _logger;

    public DriverLicenseVerificationClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DriverLicenseVerificationClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DriverLicenseVerificationResult> VerifyAsync(
        DriverLicenseVerificationFileRequest request,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["AI_VERIFICATION_BASE_URL"] ?? "http://127.0.0.1:8001";
        var apiKey = _configuration["AI_VERIFICATION_API_KEY"]
            ?? throw new InvalidOperationException("AI_VERIFICATION_API_KEY is not configured.");
        var timeoutSeconds = int.TryParse(_configuration["AI_VERIFICATION_TIMEOUT_SECONDS"], out var timeout) ? timeout : 60;

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        using var content = new MultipartFormDataContent();
        using var fileContent = new StreamContent(request.FileStream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetContentType(request.FileName));
        content.Add(fileContent, "front_image", request.FileName);

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            content.Add(new StringContent(request.FullName), "full_name");
        }

        using var response = await httpClient.PostAsync($"{baseUrl.TrimEnd('/')}/verify/driver-license-file", content, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI driver license verification returned {StatusCode}: {Body}", response.StatusCode, responseBody);
            throw new HttpRequestException($"AI driver license verification returned HTTP {response.StatusCode}: {responseBody}");
        }

        var result = JsonSerializer.Deserialize<DriverLicenseVerificationResult>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("AI driver license verification returned an empty response.");

        result.RawResponse = string.IsNullOrWhiteSpace(responseBody) ? "{}" : responseBody;
        return result;
    }

    private static string GetContentType(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "image/jpeg"
        };
    }
}
