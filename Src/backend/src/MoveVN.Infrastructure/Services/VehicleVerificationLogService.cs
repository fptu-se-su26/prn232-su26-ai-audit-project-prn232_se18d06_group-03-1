using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class VehicleVerificationLogService : IVehicleVerificationLogService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VehicleVerificationLogService> _logger;

    public VehicleVerificationLogService(IServiceProvider serviceProvider, ILogger<VehicleVerificationLogService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task LogAsync(VehicleVerificationLogEntry entry, CancellationToken cancellationToken = default)
    {
        var context = _serviceProvider.GetService<MongoDbContext>();
        if (context is null)
        {
            return;
        }

        try
        {
            await context.VehicleVerificationLogs.InsertOneAsync(new VehicleVerificationLogDocument
            {
                VehicleId = entry.VehicleId,
                VehicleDocumentId = entry.VehicleDocumentId,
                OwnerId = entry.OwnerId,
                Provider = entry.Provider,
                DocumentType = entry.DocumentType,
                Request = ToBson(entry.Request),
                Response = ToBson(entry.Response),
                Recommendation = entry.Recommendation,
                Flags = entry.Flags,
                OcrConfidence = entry.OcrConfidence,
                Message = entry.Message,
                ErrorMessage = entry.ErrorMessage,
                Action = entry.Action,
                ActorUserId = entry.ActorUserId,
                FilePublicId = entry.FilePublicId,
                FileDeletedAt = entry.FileDeletedAt,
                DeletionReason = entry.DeletionReason,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log vehicle verification result to MongoDB for vehicle {VehicleId}", entry.VehicleId);
        }
    }

    private static BsonDocument? ToBson(object? value)
    {
        return value is null ? null : BsonDocument.Parse(JsonSerializer.Serialize(value));
    }
}
