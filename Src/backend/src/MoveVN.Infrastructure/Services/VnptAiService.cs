using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class VnptAiService : IVnptAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<VnptAiService> _logger;

    public VnptAiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<VnptAiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<VnptAiResult> VerifyNationalIdAsync(
        Stream frontImage,
        string frontFileName,
        Stream? backImage,
        string? backFileName,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = _configuration["VNPT_AI_BASE_URL"] ?? "https://api.idg.vnpt.vn";
        var tokenKey = _configuration["VNPT_AI_TOKEN_KEY"];
        var tokenId = _configuration["VNPT_AI_TOKEN_ID"];
        var accessToken = _configuration["VNPT_AI_ACCESS_TOKEN"];
        var timeoutSeconds = int.TryParse(_configuration["VNPT_AI_TIMEOUT_SECONDS"], out var t) ? t : 30;

        if (string.IsNullOrWhiteSpace(tokenKey) || string.IsNullOrWhiteSpace(accessToken))
        {
            throw new InvalidOperationException("VNPT_AI credentials are not configured.");
        }

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        httpClient.DefaultRequestHeaders.Add("token-key", tokenKey);
        if (!string.IsNullOrWhiteSpace(tokenId))
            httpClient.DefaultRequestHeaders.Add("token-id", tokenId);

        try
        {
            // Step 1: Upload front image
            var frontHash = await UploadFileAsync(httpClient, baseUrl, frontImage, frontFileName, "Mặt trước CCCD", cancellationToken);
            if (frontHash is null)
            {
                return new VnptAiResult
                {
                    Success = false,
                    ErrorMessage = "Không thể upload ảnh mặt trước lên VNPT.AI",
                    RawResponse = "{}"
                };
            }

            // Step 2: Upload back image (if provided)
            string? backHash = null;
            if (backImage is not null && backFileName is not null)
            {
                backHash = await UploadFileAsync(httpClient, baseUrl, backImage, backFileName, "Mặt sau CCCD", cancellationToken);
                if (backHash is null)
                {
                    return new VnptAiResult
                    {
                        Success = false,
                        ErrorMessage = "Không thể upload ảnh mặt sau lên VNPT.AI",
                        RawResponse = "{}"
                    };
                }
            }

            // Step 3: Call OCR API with hashes
            return await PerformOcrAsync(httpClient, baseUrl, frontHash, backHash, cancellationToken);
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("VNPT.AI request timed out after {Timeout}s.", timeoutSeconds);
            throw new AppException(ErrorCode.VNPT_AI_TIMEOUT);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "VNPT.AI request failed.");
            throw new AppException(ErrorCode.VNPT_AI_VERIFICATION_FAILED, [ex.Message]);
        }
    }

    private async Task<string?> UploadFileAsync(
        HttpClient httpClient,
        string baseUrl,
        Stream imageStream,
        string fileName,
        string description,
        CancellationToken cancellationToken)
    {
        using var formContent = new MultipartFormDataContent();
        var streamContent = new StreamContent(imageStream);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(DetectMimeType(fileName));
        formContent.Add(streamContent, "file", fileName);
        formContent.Add(new StringContent(description), "title");
        formContent.Add(new StringContent(description), "description");

        using var response = await httpClient.PostAsync($"{baseUrl}/file-service/v1/addFile", formContent, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("VNPT.AI upload failed {StatusCode}: {Body}", response.StatusCode, responseBody);
            return null;
        }

        return ParseUploadResponse(responseBody);
    }

    private async Task<VnptAiResult> PerformOcrAsync(
        HttpClient httpClient,
        string baseUrl,
        string frontHash,
        string? backHash,
        CancellationToken cancellationToken)
    {
        var clientSession = $"SERVER_dotnet_8.0_Server_1.0.0_{Guid.NewGuid():N}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        var requestBody = new Dictionary<string, object?>
        {
            ["img_front"] = frontHash,
            ["client_session"] = clientSession,
            ["type"] = -1,
            ["validate_postcode"] = true,
            ["token"] = Guid.NewGuid().ToString("N")
        };

        if (backHash is not null)
            requestBody["img_back"] = backHash;

        using var requestContent = new StringContent(
            JsonSerializer.Serialize(requestBody),
            System.Text.Encoding.UTF8,
            "application/json");

        requestContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        httpClient.DefaultRequestHeaders.Add("mac-address", "TEST1");

        using var response = await httpClient.PostAsync($"{baseUrl}/ai/v1/ocr/id", requestContent, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        httpClient.DefaultRequestHeaders.Remove("mac-address");

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("VNPT.AI OCR returned {StatusCode}: {Body}", response.StatusCode, responseBody);
            return new VnptAiResult
            {
                Success = false,
                ErrorMessage = $"VNPT.AI returned HTTP {response.StatusCode}",
                RawResponse = IsValidJson(responseBody) ? responseBody : "{}"
            };
        }

        return ParseOcrResponse(responseBody);
    }

    private static string? ParseUploadResponse(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            var message = root.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "";
            if (message != "IDG-00000000")
                return null;

            if (!root.TryGetProperty("object", out var objEl))
                return null;

            return objEl.TryGetProperty("hash", out var hashEl)
                ? hashEl.GetString()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private VnptAiResult ParseOcrResponse(string responseBody)
    {
        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        var message = root.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "";
        if (message != "IDG-00000000")
        {
            var errMsg = root.TryGetProperty("object", out var errObj)
                ? errObj.TryGetProperty("msg", out var errMsgEl) ? errMsgEl.GetString() : "OCR verification failed"
                : "OCR verification failed";
            return new VnptAiResult
            {
                Success = false,
                ErrorMessage = errMsg,
                RawResponse = responseBody
            };
        }

        if (!root.TryGetProperty("object", out var obj))
        {
            return new VnptAiResult
            {
                Success = false,
                ErrorMessage = "No data returned from VNPT.AI OCR",
                RawResponse = responseBody
            };
        }

        var msg = GetString(obj, "msg");
        if (msg != "OK")
        {
            return new VnptAiResult
            {
                Success = false,
                ErrorMessage = msg ?? "OCR verification failed",
                RawResponse = responseBody,
                IsBlurry = true
            };
        }

        var warning = obj.TryGetProperty("warning", out var warnEl) && warnEl.ValueKind == JsonValueKind.Array
            ? JsonSerializer.Deserialize<List<string>>(warnEl.GetRawText())
            : null;
        var isBlurry = warning?.Any(w => w.Contains("mo_nhoe") || w.Contains("mat_goc") || w.Contains("mo")) ?? false;

        var dateOfBirth = ParseDate(obj, "birth_day");
        var issueDate = ParseDate(obj, "issue_date");
        var expiryDate = ParseDate(obj, "valid_date");

        return new VnptAiResult
        {
            Success = true,
            NationalId = GetString(obj, "id", "citizen_id"),
            FullName = GetString(obj, "name"),
            DateOfBirth = dateOfBirth,
            Sex = GetString(obj, "gender"),
            HomeAddress = GetString(obj, "origin_location"),
            Address = GetString(obj, "recent_location"),
            IssueDate = issueDate,
            ExpiryDate = expiryDate,
            CardType = GetString(obj, "card_type"),
            Confidence = 1m,
            RawResponse = responseBody,
            IsLowConfidence = false,
            IsBlurry = isBlurry
        };
    }

    private static string? GetString(JsonElement data, params string[] propertyNames)
    {
        foreach (var prop in propertyNames)
        {
            if (data.TryGetProperty(prop, out var el) && el.ValueKind == JsonValueKind.String)
            {
                var val = el.GetString();
                if (!string.IsNullOrWhiteSpace(val)) return val;
            }
        }
        return null;
    }

    private static DateOnly? ParseDate(JsonElement data, params string[] propertyNames)
    {
        foreach (var prop in propertyNames)
        {
            if (data.TryGetProperty(prop, out var el))
            {
                var raw = el.ValueKind == JsonValueKind.String ? el.GetString() : null;
                if (string.IsNullOrWhiteSpace(raw)) continue;

                if (DateOnly.TryParseExact(raw, ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "yyyy/MM/dd", "dd-MM-yyyy"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                {
                    return parsed;
                }
            }
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

    private static bool IsValidJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        try { JsonDocument.Parse(value); return true; }
        catch (JsonException) { return false; }
    }
}
