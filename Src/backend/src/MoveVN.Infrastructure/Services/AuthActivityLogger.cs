using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class AuthActivityLogger : IAuthActivityLogger
{
    private readonly IServiceProvider _serviceProvider;

    public AuthActivityLogger(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task LogAsync(
        long? userId,
        string? email,
        AuthEventType eventType,
        string? ipAddress,
        string? userAgent,
        object? metadata = null,
        CancellationToken cancellationToken = default)
    {
        var context = _serviceProvider.GetService<MongoDbContext>();
        if (context is null)
        {
            return;
        }

        await context.UserActivityLogs.InsertOneAsync(new UserActivityLogDocument
        {
            UserId = userId?.ToString(),
            Event = eventType.ToString(),
            IpAddress = ipAddress,
            DeviceType = userAgent,
            Properties = metadata is null
                ? null
                : BsonDocument.Parse(JsonSerializer.Serialize(metadata)),
            Timestamp = DateTime.UtcNow
        }, cancellationToken: cancellationToken);
    }
}
