using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class AuthActivityLogger : IAuthActivityLogger
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AuthActivityLogger> _logger;

    public AuthActivityLogger(IServiceProvider serviceProvider, ILogger<AuthActivityLogger> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public Task LogAsync(
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
            return Task.CompletedTask;
        }

        _ = LogCoreAsync(context, userId, email, eventType, ipAddress, userAgent, metadata);
        return Task.CompletedTask;
    }

    private async Task LogCoreAsync(
        MongoDbContext context,
        long? userId,
        string? email,
        AuthEventType eventType,
        string? ipAddress,
        string? userAgent,
        object? metadata)
    {
        try
        {
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
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log auth activity: {Event}", eventType);
        }
    }
}
