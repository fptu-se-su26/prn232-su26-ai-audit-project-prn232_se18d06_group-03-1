using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Services;

public class RiskScoringService : IRiskScoringService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public RiskScoringService(IHttpClientFactory httpClientFactory, AppDbContext context, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _context = context;
        _configuration = configuration;
    }

    public async Task<RiskPredictionDto> PredictAndLogAsync(RiskPredictionRequest request, CancellationToken cancellationToken = default)
    {
        var prediction = await PredictAsync(request, cancellationToken);

        await _context.MLPredictionLogs.AddAsync(new Domain.Entities.MLPredictionLog
        {
            BookingId = request.BookingId,
            ModelVersion = prediction.ModelVersion,
            RiskScore = prediction.RiskScore,
            FeatureSnapshot = System.Text.Json.JsonSerializer.Serialize(request),
            TopRiskFactors = System.Text.Json.JsonSerializer.Serialize(prediction.TopRiskFactors),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);
        if (booking is not null)
        {
            booking.RiskScore = prediction.RiskScore;
            booking.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return prediction;
    }

    public async Task<RiskPredictionDto?> GetLatestByBookingAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var log = await _context.MLPredictionLogs
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (log is null) return null;

        return new RiskPredictionDto
        {
            BookingId = bookingId,
            RiskScore = log.RiskScore,
            RiskLevel = log.RiskScore >= 70 ? "High" : log.RiskScore >= 40 ? "Medium" : "Low",
            Probability = Math.Round(log.RiskScore / 100m, 2),
            ModelVersion = log.ModelVersion,
            TopRiskFactors = DeserializeFactors(log.TopRiskFactors),
            CreatedAt = log.CreatedAt
        };
    }

    public async Task<PagedResult<BookingResponse>> GetHighRiskBookingsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var threshold = decimal.TryParse(_configuration["Risk:Threshold"], out var configured)
            ? configured
            : 70m;

        var query = _context.Bookings
            .Where(b => (b.RiskScore ?? 0) >= threshold)
            .OrderByDescending(b => b.RiskScore)
            .ThenByDescending(b => b.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                VehicleId = b.VehicleId,
                OwnerId = b.OwnerId,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                TotalDays = b.TotalDays,
                BasePrice = b.BasePrice,
                PlatformFee = b.PlatformFee,
                DepositAmount = b.DepositAmount,
                TotalAmount = b.TotalAmount,
                PickupAddress = b.PickupAddress,
                CustomerNote = b.CustomerNote,
                Status = b.Status,
                RiskScore = b.RiskScore,
                CancelReason = b.CancelReason,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<BookingResponse>.Create(items, total, page, pageSize);
    }

    private async Task<RiskPredictionDto> PredictAsync(RiskPredictionRequest request, CancellationToken cancellationToken)
    {
        var baseUrl = _configuration["Ml:RiskServiceUrl"];
        if (!string.IsNullOrWhiteSpace(baseUrl))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("ml-risk");
                client.BaseAddress = new Uri(baseUrl);
                var response = await client.PostAsJsonAsync("/predict-risk", request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var dto = await response.Content.ReadFromJsonAsync<RiskPredictionDto>(cancellationToken: cancellationToken);
                    if (dto is not null)
                        return dto;
                }
            }
            catch
            {
            }
        }

        var factors = new List<string>();
        decimal score = 25;
        if ((request.TrustScore ?? 100) < 30)
        {
            score += 45;
            factors.Add("Low trust score");
        }
        if (request.CancelCount > 2)
        {
            score += 35;
            factors.Add("Frequent cancellations");
        }
        if (request.DurationDays >= 7)
        {
            score += 10;
            factors.Add("Long booking duration");
        }
        if (request.VehicleValue >= 5_000_000)
        {
            score += 10;
            factors.Add("High vehicle value");
        }

        score = Math.Clamp(score, 0, 100);
        return new RiskPredictionDto
        {
            BookingId = request.BookingId,
            RiskScore = score,
            RiskLevel = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low",
            Probability = Math.Round(score / 100m, 2),
            ModelVersion = "rule-based-v1",
            TopRiskFactors = factors,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static List<string> DeserializeFactors(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return new List<string>();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(raw) ?? new List<string>();
        }
        catch
        {
            return new List<string> { raw };
        }
    }
}
