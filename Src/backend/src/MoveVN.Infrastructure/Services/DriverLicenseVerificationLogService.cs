using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class DriverLicenseVerificationLogService : IDriverLicenseVerificationLogService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DriverLicenseVerificationLogService> _logger;

    public DriverLicenseVerificationLogService(IServiceProvider serviceProvider, ILogger<DriverLicenseVerificationLogService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task LogAsync(DriverLicenseVerificationLogEntry entry, CancellationToken cancellationToken = default)
    {
        var context = _serviceProvider.GetService<MongoDbContext>();
        if (context is null)
        {
            return;
        }

        try
        {
            await context.DriverLicenseVerificationLogs.InsertOneAsync(new DriverLicenseVerificationLogDocument
            {
                UserId = entry.UserId,
                VerificationRequestId = entry.VerificationRequestId,
                Provider = entry.Provider,
                DocumentType = entry.DocumentType,
                Request = ToBson(entry.Request),
                Response = ToBson(entry.Response),
                Recommendation = entry.Recommendation,
                Flags = entry.Flags,
                OcrConfidence = entry.OcrConfidence,
                Message = entry.Message,
                ErrorMessage = entry.ErrorMessage,
                FilePublicId = entry.FilePublicId,
                FileDeletedAt = entry.FileDeletedAt,
                DeletionReason = entry.DeletionReason,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log driver license verification result to MongoDB for user {UserId}", entry.UserId);
        }
    }

    private static BsonDocument? ToBson(object? value)
    {
        return value is null ? null : BsonDocument.Parse(JsonSerializer.Serialize(value));
    }
}
