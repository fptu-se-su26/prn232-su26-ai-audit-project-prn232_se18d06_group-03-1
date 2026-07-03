using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Staff,Admin,Owner")]
[Route("api/bookings")]
public class BookingRiskController : BaseApiController
{
    private static readonly HttpClient RiskAiClient = new()
    {
        BaseAddress = new Uri(Environment.GetEnvironmentVariable("RISK_AI_BASE_URL") ?? "http://127.0.0.1:8010"),
        Timeout = TimeSpan.FromSeconds(10)
    };

    [HttpPost("{bookingId:long}/risk-score")]
    public async Task<ActionResult<ApiResponse<BookingRiskResponse>>> Predict(
        long bookingId,
        BookingRiskRequest? request,
        CancellationToken cancellationToken = default)
    {
        var input = CreateRiskInput(bookingId, request);
        var aiResult = await RiskAiClient.PostAsJsonAsync("/predict-risk", input, cancellationToken);

        if (!aiResult.IsSuccessStatusCode)
        {
            var error = await aiResult.Content.ReadAsStringAsync(cancellationToken);
            return StatusCode(
                StatusCodes.Status502BadGateway,
                ApiResponse<BookingRiskResponse>.Failed(
                    "RISK_AI_UNAVAILABLE",
                    "Risk AI service is unavailable. Start risk-ai-service on port 8010.",
                    [error]));
        }

        var prediction = await aiResult.Content.ReadFromJsonAsync<RiskPredictionResponse>(cancellationToken);
        if (prediction is null)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                ApiResponse<BookingRiskResponse>.Failed(
                    "RISK_AI_INVALID_RESPONSE",
                    "Risk AI service returned an invalid response."));
        }

        return Success(new BookingRiskResponse(input, prediction), "Booking risk score predicted.");
    }

    private static RiskPredictionInput CreateRiskInput(long bookingId, BookingRiskRequest? request)
    {
        var bucket = Math.Abs(bookingId % 3);

        var trustScore = bucket switch
        {
            0 => 25m,
            1 => 58m,
            _ => 92m
        };

        var cancelCount = bucket switch
        {
            0 => 1,
            1 => 2,
            _ => 0
        };

        var duration = bucket switch
        {
            0 => 5m,
            1 => 14m,
            _ => 2m
        };

        var vehicleValue = bucket switch
        {
            0 => 850_000_000m,
            1 => 1_200_000_000m,
            _ => 250_000_000m
        };

        return new RiskPredictionInput(
            bookingId,
            request?.TrustScore ?? trustScore,
            request?.CancelCount ?? cancelCount,
            request?.Duration ?? duration,
            request?.VehicleValue ?? vehicleValue);
    }
}

public record BookingRiskRequest(
    decimal? TrustScore,
    int? CancelCount,
    decimal? Duration,
    decimal? VehicleValue);

public record BookingRiskResponse(
    RiskPredictionInput Input,
    RiskPredictionResponse Prediction);

public record RiskPredictionInput(
    [property: JsonPropertyName("bookingId")] long BookingId,
    [property: JsonPropertyName("trust_score")] decimal TrustScore,
    [property: JsonPropertyName("cancel_count")] int CancelCount,
    [property: JsonPropertyName("duration")] decimal Duration,
    [property: JsonPropertyName("vehicle_value")] decimal VehicleValue);

public record RiskPredictionResponse(
    [property: JsonPropertyName("bookingId")] long BookingId,
    [property: JsonPropertyName("risk_level")] string RiskLevel,
    [property: JsonPropertyName("probability")] decimal Probability,
    [property: JsonPropertyName("risk_score")] int RiskScore,
    [property: JsonPropertyName("suggested_action")] string SuggestedAction,
    [property: JsonPropertyName("operational_decision")] string OperationalDecision,
    [property: JsonPropertyName("deposit_recommendation")] DepositRecommendation DepositRecommendation,
    [property: JsonPropertyName("top_risk_factors")] IReadOnlyList<string> TopRiskFactors,
    [property: JsonPropertyName("explanation")] string Explanation,
    [property: JsonPropertyName("retrieved_context")] IReadOnlyList<RiskRetrievedContext> RetrievedContext,
    [property: JsonPropertyName("modelVersion")] string ModelVersion);

public record RiskRetrievedContext(
    [property: JsonPropertyName("source")] string Source,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("relevance")] decimal Relevance);

public record DepositRecommendation(
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("rate")] decimal Rate,
    [property: JsonPropertyName("amount")] long Amount,
    [property: JsonPropertyName("reason")] string Reason);
