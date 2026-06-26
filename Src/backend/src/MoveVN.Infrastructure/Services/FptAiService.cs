using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class FptAiService : IFptAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FptAiService> _logger;

    public FptAiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<FptAiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<FptAiResult> VerifyNationalIdAsync(
        Stream frontImage,
        string frontFileName,
        Stream? backImage,
        string? backFileName,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["FPT_AI_API_KEY"];
        var apiUrl = _configuration["FPT_AI_ID_RECOGNITION_URL"] ?? "https://api.fpt.ai/vision/idr/vnm";
        var timeoutSeconds = int.TryParse(_configuration["FPT_AI_TIMEOUT_SECONDS"], out var t) ? t : 30;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("FPT_AI_API_KEY is not configured.");
        }

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

        using var formContent = new MultipartFormDataContent();
        var frontStreamContent = new StreamContent(frontImage);
        frontStreamContent.Headers.ContentType = new MediaTypeHeaderValue(DetectMimeType(frontFileName));
        formContent.Add(frontStreamContent, "image", frontFileName);

        if (backImage is not null && backFileName is not null)
        {
            var backStreamContent = new StreamContent(backImage);
            backStreamContent.Headers.ContentType = new MediaTypeHeaderValue(DetectMimeType(backFileName));
            formContent.Add(backStreamContent, "image", backFileName);
        }

        try
        {
            using var response = await httpClient.PostAsync(apiUrl, formContent, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("FPT.AI returned {StatusCode}: {Body}", response.StatusCode, responseBody);
                return new FptAiResult
                {
                    Success = false,
                    ErrorMessage = $"FPT.AI returned HTTP {response.StatusCode}",
                    RawResponse = responseBody
                };
            }

            return ParseFptAiResponse(responseBody);
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("FPT.AI request timed out after {Timeout}s.", timeoutSeconds);
            throw new AppException(ErrorCode.FPT_AI_TIMEOUT);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "FPT.AI request failed.");
            throw new AppException(ErrorCode.FPT_AI_VERIFICATION_FAILED, [ex.Message]);
        }
    }

    private FptAiResult ParseFptAiResponse(string responseBody)
    {
        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        var errorCode = root.TryGetProperty("errorCode", out var ec) ? ec.GetInt32() : -1;
        if (errorCode != 0)
        {
            var errorMsg = root.TryGetProperty("errorMessage", out var em) ? em.GetString() : "Unknown error";
            return new FptAiResult
            {
                Success = false,
                ErrorMessage = errorMsg,
                RawResponse = responseBody
            };
        }

        if (!root.TryGetProperty("data", out var dataArray) || dataArray.GetArrayLength() == 0)
        {
            return new FptAiResult
            {
                Success = false,
                ErrorMessage = "No data returned from FPT.AI",
                RawResponse = responseBody
            };
        }

        var data = dataArray[0];
        var confidenceStr = data.TryGetProperty("confidence", out var confEl)
            ? confEl.GetString()
            : null;
        var confidence = decimal.TryParse(confidenceStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var confVal) ? confVal : 0m;

        var dateOfBirth = ParseFptAiDate(data, "dob");
        var issueDate = ParseFptAiDate(data, "issue_date");
        var expiryDate = ParseFptAiDate(data, "doe");

        var isBlurry = data.TryGetProperty("isBlurry", out var blurEl) && blurEl.GetBoolean();
        var isLowQuality = confidence > 0 && confidence < 0.7m;

        return new FptAiResult
        {
            Success = true,
            NationalId = data.TryGetProperty("id", out var idEl) ? idEl.GetString() : null,
            FullName = data.TryGetProperty("name", out var nameEl) ? nameEl.GetString() : null,
            DateOfBirth = dateOfBirth,
            Sex = data.TryGetProperty("sex", out var sexEl) ? sexEl.GetString() : null,
            HomeAddress = data.TryGetProperty("home", out var homeEl) ? homeEl.GetString() : null,
            Address = data.TryGetProperty("address", out var addrEl) ? addrEl.GetString() : null,
            IssueDate = issueDate,
            ExpiryDate = expiryDate,
            CardType = data.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null,
            Confidence = confidence,
            RawResponse = responseBody,
            IsBlurry = isBlurry,
            IsLowConfidence = isLowQuality
        };
    }

    private static DateOnly? ParseFptAiDate(JsonElement data, string propertyName)
    {
        if (!data.TryGetProperty(propertyName, out var el))
        {
            return null;
        }

        var raw = el.GetString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (DateOnly.TryParseExact(raw, ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "yyyy/MM/dd"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static string DetectMimeType(string fileName)
    {
        var ext = Path.GetExtension(fileName)?.ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".jpeg" or ".jpg" or _ => "image/jpeg",
        };
    }
}
