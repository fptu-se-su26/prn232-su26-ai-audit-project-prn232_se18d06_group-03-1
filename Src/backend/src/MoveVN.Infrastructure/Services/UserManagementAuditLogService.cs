using MongoDB.Driver;
using MoveVN.Application.Modules.UserManagementAuditLog.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class UserManagementAuditLogService : IUserManagementAuditLogService
{
    private readonly MongoDbContext _context;

    public UserManagementAuditLogService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(long actorId, string actorName, string actorRole, string action,
                                long targetUserId, string targetUserName,
                                string? oldValue = null, string? newValue = null,
                                string? ipAddress = null, CancellationToken ct = default)
    {
        var doc = new UserManagementAuditLogDocument
        {
            ActorId = actorId,
            ActorName = actorName,
            ActorRole = actorRole,
            Action = action,
            TargetUserId = targetUserId,
            TargetUserName = targetUserName,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };

        try
        {
            await _context.UserManagementAuditLogs.InsertOneAsync(doc, cancellationToken: ct);
        }
        catch
        {
            // silently fail - logging should never break the main operation
        }
    }

    public async Task<List<UserManagementAuditLogItem>> GetByTargetUserIdAsync(long targetUserId, int limit = 50, CancellationToken ct = default)
    {
        var filter = Builders<UserManagementAuditLogDocument>.Filter.Eq(x => x.TargetUserId, targetUserId);
        var sort = Builders<UserManagementAuditLogDocument>.Sort.Descending(x => x.Timestamp);

        var docs = await _context.UserManagementAuditLogs
            .Find(filter)
            .Sort(sort)
            .Limit(limit)
            .ToListAsync(ct);

        return docs.Select(d => new UserManagementAuditLogItem
        {
            ActorName = d.ActorName,
            ActorRole = d.ActorRole,
            Action = d.Action,
            OldValue = d.OldValue,
            NewValue = d.NewValue,
            IpAddress = d.IpAddress,
            Timestamp = d.Timestamp
        }).ToList();
    }
}