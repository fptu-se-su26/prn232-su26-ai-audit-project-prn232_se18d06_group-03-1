using MoveVN.Application.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo;
using MongoDB.Driver;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Infrastructure.Services;

public class BroadcastNotificationLogService : IBroadcastNotificationLogService
{
    private readonly MongoDbContext _context;

    public BroadcastNotificationLogService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task LogBroadcastAsync(BroadcastNotificationLogDocument log, CancellationToken cancellationToken = default)
    {
        await _context.BroadcastNotificationLogs.InsertOneAsync(log, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<BroadcastNotificationLogResponse>> GetLogsAsync(
        string? keyword, string? channel, string? status, DateTime? fromDate, DateTime? toDate,
        int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var filters = new List<FilterDefinition<BroadcastNotificationLogDocument>>();
        var builder = Builders<BroadcastNotificationLogDocument>.Filter;
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var escaped = System.Text.RegularExpressions.Regex.Escape(keyword.Trim());
            filters.Add(builder.Or(
                builder.Regex(x => x.Title, new MongoDB.Bson.BsonRegularExpression(escaped, "i")),
                builder.Regex(x => x.SenderName, new MongoDB.Bson.BsonRegularExpression(escaped, "i"))));
        }
        if (!string.IsNullOrWhiteSpace(channel)) filters.Add(builder.Eq(x => x.Channel, channel));
        if (!string.IsNullOrWhiteSpace(status)) filters.Add(builder.Eq(x => x.Status, status));
        if (fromDate.HasValue) filters.Add(builder.Gte(x => x.Timestamp, fromDate.Value));
        if (toDate.HasValue) filters.Add(builder.Lt(x => x.Timestamp, toDate.Value.Date.AddDays(1)));

        var filter = filters.Count == 0 ? builder.Empty : builder.And(filters);
        var total = await _context.BroadcastNotificationLogs.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
        var documents = await _context.BroadcastNotificationLogs.Find(filter)
            .SortByDescending(x => x.Timestamp)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<BroadcastNotificationLogResponse>
        {
            Items = documents.Select(x => new BroadcastNotificationLogResponse
            {
                Id = x.Id ?? string.Empty,
                SenderId = x.SenderId,
                SenderName = x.SenderName,
                SenderRole = x.SenderRole,
                Title = x.Title,
                Body = x.Body,
                Channel = x.Channel,
                TargetType = x.TargetType,
                TargetRoles = x.TargetRoles,
                TargetUserIds = x.TargetUserIds,
                TotalTargeted = x.TotalTargeted,
                SuccessCount = x.SuccessCount,
                FailedCount = x.FailedCount,
                Status = x.Status,
                Errors = x.Errors,
                Timestamp = x.Timestamp,
                CompletedAt = x.CompletedAt
            }).ToList(),
            TotalCount = (int)Math.Min(total, int.MaxValue),
            Page = page,
            PageSize = pageSize
        };
    }
}
