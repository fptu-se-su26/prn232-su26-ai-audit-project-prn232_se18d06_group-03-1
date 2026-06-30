using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class VehicleVerificationLogQueryService : IVehicleVerificationLogQueryService
{
    private readonly IServiceProvider _serviceProvider;

    public VehicleVerificationLogQueryService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task<List<VehicleVerificationLogSummary>> GetByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        var context = _serviceProvider.GetService<MongoDbContext>();
        if (context is null)
        {
            return [];
        }

        var logs = await context.VehicleVerificationLogs
            .Find(log => log.VehicleId == vehicleId)
            .SortByDescending(log => log.CreatedAt)
            .Limit(20)
            .ToListAsync(cancellationToken);

        return logs.Select(log => new VehicleVerificationLogSummary
        {
            Id = log.Id,
            VehicleId = log.VehicleId,
            VehicleDocumentId = log.VehicleDocumentId,
            Recommendation = log.Recommendation,
            Flags = log.Flags,
            OcrConfidence = log.OcrConfidence,
            Message = log.Message,
            ErrorMessage = log.ErrorMessage,
            CreatedAt = log.CreatedAt
        }).ToList();
    }
}
