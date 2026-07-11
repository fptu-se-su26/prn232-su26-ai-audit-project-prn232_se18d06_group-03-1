using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class NationalIdVerificationClient : INationalIdVerificationClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NationalIdVerificationClient> _logger;

    public NationalIdVerificationClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<NationalIdVerificationClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<NationalIdPreVerifyResult?> PreVerifyAsync(
        byte[] imageBytes, string fileName, CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["AI_VERIFICATION_BASE_URL"] ?? "http://127.0.0.1:8001";
        var apiKey = _configuration["AI_VERIFICATION_API_KEY"]
            ?? throw new InvalidOperationException("AI_VERIFICATION_API_KEY is not configured.");
        var timeoutSeconds = int.TryParse(_configuration["AI_VERIFICATION_TIMEOUT_SECONDS"], out var timeout) ? timeout : 60;

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        using var content = new MultipartFormDataContent();
        using var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetContentType(fileName));
        content.Add(fileContent, "frontImage", fileName);

        using var response = await httpClient.PostAsync(
            $"{baseUrl.TrimEnd('/')}/verify/national-id/upload", content, cancellationToken);

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI national ID verification returned {StatusCode}: {Body}", response.StatusCode, responseBody);
            return null;
        }

        var raw = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var success = raw.TryGetProperty("success", out var s) && s.GetBoolean();

        if (!success)
        {
            _logger.LogWarning("AI national ID verification failed: {Body}", responseBody);
            return null;
        }

        var confidence = raw.TryGetProperty("confidence", out var c) ? c.GetDouble() : 0.0;

        string? nationalId = null;
        string? fullName = null;
        DateTime? dateOfBirth = null;
        string? address = null;
        List<string> flags = [];

        if (raw.TryGetProperty("extracted", out var extracted))
        {
            nationalId = extracted.TryGetProperty("nationalId", out var nid) ? nid.GetString() : null;
            fullName = extracted.TryGetProperty("fullName", out var fn) ? fn.GetString() : null;
            address = extracted.TryGetProperty("address", out var addr) ? addr.GetString() : null;

            if (extracted.TryGetProperty("dateOfBirth", out var dob) && dob.ValueKind == JsonValueKind.String)
            {
                var dobStr = dob.GetString();
                if (!string.IsNullOrWhiteSpace(dobStr))
                {
                    if (DateTime.TryParseExact(dobStr, ["dd/MM/yyyy", "yyyy-MM-dd", "d/M/yyyy"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDob))
                    {
                        dateOfBirth = parsedDob;
                    }
                }
            }
        }

        if (raw.TryGetProperty("flags", out var f) && f.ValueKind == JsonValueKind.Array)
        {
            foreach (var flag in f.EnumerateArray())
            {
                var val = flag.GetString();
                if (val is not null) flags.Add(val);
            }
        }

        return new NationalIdPreVerifyResult
        {
            Success = success,
            Confidence = confidence,
            NationalId = nationalId,
            FullName = fullName,
            DateOfBirth = dateOfBirth,
            Address = address,
            Flags = flags,
            RawResponse = string.IsNullOrWhiteSpace(responseBody) ? "{}" : responseBody
        };
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
