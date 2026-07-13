using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Locations.DTOs;
using MoveVN.Application.Modules.Locations.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class GoongPlaceService : IGoongPlaceService
{
    private const string BaseUrl = "https://rsapi.goong.io";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GoongPlaceService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<GoongPlaceAutocompleteResponse> AutocompleteAsync(string input, int limit = 5, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Trim().Length < 2)
        {
            return new GoongPlaceAutocompleteResponse();
        }

        var uri = BuildUri("/v2/place/autocomplete", new Dictionary<string, string?>
        {
            ["input"] = input.Trim(),
            ["limit"] = Math.Clamp(limit, 1, 10).ToString(),
            ["more_compound"] = "true",
            ["has_deprecated_administrative_unit"] = "true"
        });

        var client = _httpClientFactory.CreateClient();
        var response = await client.GetFromJsonAsync<GoongAutocompleteApiResponse>(uri, JsonOptions, cancellationToken)
            ?? throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);

        return new GoongPlaceAutocompleteResponse
        {
            Predictions = response.Predictions
                .Where(prediction => !string.IsNullOrWhiteSpace(prediction.PlaceId))
                .Select(prediction => new GoongPlacePrediction
                {
                    Description = prediction.Description,
                    PlaceId = prediction.PlaceId,
                    StructuredFormatting = prediction.StructuredFormatting is null
                        ? null
                        : new GoongStructuredFormatting
                        {
                            MainText = prediction.StructuredFormatting.MainText,
                            SecondaryText = prediction.StructuredFormatting.SecondaryText
                        },
                    Compound = prediction.Compound is null
                        ? null
                        : new GoongCompound
                        {
                            Commune = prediction.Compound.Commune,
                            Province = prediction.Compound.Province
                        }
                })
                .ToList()
        };
    }

    public async Task<GoongPlaceDetailResponse> GetDetailAsync(string placeId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(placeId))
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["placeId is required."]);
        }

        var uri = BuildUri("/v2/place/detail", new Dictionary<string, string?>
        {
            ["place_id"] = placeId.Trim(),
            ["has_deprecated_administrative_unit"] = "true"
        });

        var client = _httpClientFactory.CreateClient();
        var response = await client.GetFromJsonAsync<GoongDetailApiResponse>(uri, JsonOptions, cancellationToken)
            ?? throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);

        var location = response.Result?.Geometry?.Location
            ?? throw new AppException(ErrorCode.NOT_FOUND);

        return new GoongPlaceDetailResponse
        {
            PlaceId = response.Result?.PlaceId ?? placeId,
            FormattedAddress = response.Result?.FormattedAddress ?? "",
            Name = response.Result?.Name ?? "",
            Latitude = location.Lat,
            Longitude = location.Lng
        };
    }

    private Uri BuildUri(string path, Dictionary<string, string?> query)
    {
        var apiKey = _configuration["GOONG_API_KEY"]
            ?? _configuration["GOONG__ApiKey"]
            ?? Environment.GetEnvironmentVariable("GOONG_API_KEY")
            ?? Environment.GetEnvironmentVariable("GOONG__ApiKey");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, ["GOONG_API_KEY is not configured."]);
        }

        query["api_key"] = apiKey;

        var builder = new UriBuilder(BaseUrl)
        {
            Path = path,
            Query = string.Join("&", query
                .Where(pair => !string.IsNullOrWhiteSpace(pair.Value))
                .Select(pair => $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value!)}"))
        };

        return builder.Uri;
    }

    private sealed class GoongAutocompleteApiResponse
    {
        public List<GoongPredictionApiModel> Predictions { get; set; } = [];
    }

    private sealed class GoongPredictionApiModel
    {
        public string Description { get; set; } = string.Empty;
        [JsonPropertyName("place_id")]
        public string PlaceId { get; set; } = string.Empty;
        [JsonPropertyName("structured_formatting")]
        public GoongStructuredFormattingApiModel? StructuredFormatting { get; set; }
        public GoongCompoundApiModel? Compound { get; set; }
    }

    private sealed class GoongStructuredFormattingApiModel
    {
        [JsonPropertyName("main_text")]
        public string MainText { get; set; } = string.Empty;
        [JsonPropertyName("secondary_text")]
        public string SecondaryText { get; set; } = string.Empty;
    }

    private sealed class GoongCompoundApiModel
    {
        public string? Commune { get; set; }
        public string? Province { get; set; }
    }

    private sealed class GoongDetailApiResponse
    {
        public GoongPlaceDetailApiModel? Result { get; set; }
    }

    private sealed class GoongPlaceDetailApiModel
    {
        [JsonPropertyName("place_id")]
        public string PlaceId { get; set; } = string.Empty;
        [JsonPropertyName("formatted_address")]
        public string FormattedAddress { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public GoongGeometryApiModel? Geometry { get; set; }
    }

    private sealed class GoongGeometryApiModel
    {
        public GoongLocationApiModel? Location { get; set; }
    }

    private sealed class GoongLocationApiModel
    {
        public decimal Lat { get; set; }
        public decimal Lng { get; set; }
    }
}
