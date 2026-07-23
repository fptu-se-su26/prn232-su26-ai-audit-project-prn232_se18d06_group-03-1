using MongoDB.Driver;
using MoveVN.Domain.Documents;

namespace MoveVN.Infrastructure.Persistence.Mongo;

public class MongoIndexInitializer
{
    private readonly MongoDbContext _context;

    public MongoIndexInitializer(MongoDbContext context)
    {
        _context = context;
    }

    public async Task CreateIndexesAsync(CancellationToken cancellationToken = default)
    {
        await _context.ChatRooms.Indexes.CreateManyAsync([
            new CreateIndexModel<ChatRoomDocument>(Builders<ChatRoomDocument>.IndexKeys.Ascending(x => x.BookingId)),
            new CreateIndexModel<ChatRoomDocument>(Builders<ChatRoomDocument>.IndexKeys.Ascending("participants.userId"))
        ], cancellationToken);

        await _context.ChatMessages.Indexes.CreateManyAsync([
            new CreateIndexModel<ChatMessageDocument>(Builders<ChatMessageDocument>.IndexKeys.Ascending(x => x.RoomId).Descending(x => x.SentAt)),
            new CreateIndexModel<ChatMessageDocument>(Builders<ChatMessageDocument>.IndexKeys.Ascending(x => x.SentAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(180) })
        ], cancellationToken);

        await _context.NotificationQueue.Indexes.CreateManyAsync([
            new CreateIndexModel<NotificationQueueDocument>(Builders<NotificationQueueDocument>.IndexKeys.Ascending(x => x.Status).Ascending(x => x.ScheduledAt)),
            new CreateIndexModel<NotificationQueueDocument>(Builders<NotificationQueueDocument>.IndexKeys.Ascending(x => x.SentAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(7) })
        ], cancellationToken);

        await _context.PushTokens.Indexes.CreateManyAsync([
            new CreateIndexModel<PushTokenDocument>(Builders<PushTokenDocument>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.DeviceId), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<PushTokenDocument>(Builders<PushTokenDocument>.IndexKeys.Ascending(x => x.LastUsedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(90) })
        ], cancellationToken);

        await _context.UserActivityLogs.Indexes.CreateManyAsync([
            new CreateIndexModel<UserActivityLogDocument>(Builders<UserActivityLogDocument>.IndexKeys.Ascending(x => x.Timestamp), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(90) }),
            new CreateIndexModel<UserActivityLogDocument>(Builders<UserActivityLogDocument>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.SessionId).Descending(x => x.Timestamp))
        ], cancellationToken: cancellationToken);

        await _context.SearchLogs.Indexes.CreateOneAsync(
            new CreateIndexModel<SearchLogDocument>(Builders<SearchLogDocument>.IndexKeys.Ascending(x => x.Timestamp), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(30) }),
            cancellationToken: cancellationToken);

        await _context.PricingCalculationLogs.Indexes.CreateOneAsync(
            new CreateIndexModel<PricingCalculationLogDocument>(Builders<PricingCalculationLogDocument>.IndexKeys.Ascending(x => x.CreatedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(7) }),
            cancellationToken: cancellationToken);

        await _context.VehicleVerificationLogs.Indexes.CreateManyAsync([
            new CreateIndexModel<VehicleVerificationLogDocument>(
                Builders<VehicleVerificationLogDocument>.IndexKeys.Ascending(x => x.VehicleId).Descending(x => x.CreatedAt)),
            new CreateIndexModel<VehicleVerificationLogDocument>(
                Builders<VehicleVerificationLogDocument>.IndexKeys.Ascending(x => x.VehicleDocumentId).Descending(x => x.CreatedAt))
        ], cancellationToken);

        await _context.DriverLicenseVerificationLogs.Indexes.CreateManyAsync([
            new CreateIndexModel<DriverLicenseVerificationLogDocument>(
                Builders<DriverLicenseVerificationLogDocument>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.CreatedAt)),
            new CreateIndexModel<DriverLicenseVerificationLogDocument>(
                Builders<DriverLicenseVerificationLogDocument>.IndexKeys.Ascending(x => x.VerificationRequestId).Descending(x => x.CreatedAt))
        ], cancellationToken);

        await _context.NationalIdVerificationLogs.Indexes.CreateManyAsync([
            new CreateIndexModel<NationalIdVerificationLogDocument>(
                Builders<NationalIdVerificationLogDocument>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.CreatedAt)),
            new CreateIndexModel<NationalIdVerificationLogDocument>(
                Builders<NationalIdVerificationLogDocument>.IndexKeys.Ascending(x => x.VerificationRequestId).Descending(x => x.CreatedAt))
        ], cancellationToken);

        await _context.PricingRules.Indexes.CreateOneAsync(
            new CreateIndexModel<PricingRuleDocument>(Builders<PricingRuleDocument>.IndexKeys.Ascending(x => x.RuleCode).Ascending(x => x.IsActive)),
            cancellationToken: cancellationToken);

        await _context.WeatherSnapshots.Indexes.CreateManyAsync([
            new CreateIndexModel<WeatherSnapshotDocument>(Builders<WeatherSnapshotDocument>.IndexKeys.Ascending(x => x.AreaId).Ascending(x => x.Date).Ascending(x => x.Hour)),
            new CreateIndexModel<WeatherSnapshotDocument>(Builders<WeatherSnapshotDocument>.IndexKeys.Ascending(x => x.CreatedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(30) })
        ], cancellationToken);

        await _context.DemandSnapshots.Indexes.CreateManyAsync([
            new CreateIndexModel<DemandSnapshotDocument>(Builders<DemandSnapshotDocument>.IndexKeys.Ascending(x => x.AreaId).Ascending(x => x.Date)),
            new CreateIndexModel<DemandSnapshotDocument>(Builders<DemandSnapshotDocument>.IndexKeys.Ascending(x => x.CreatedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(90) })
        ], cancellationToken);

        await _context.UserManagementAuditLogs.Indexes.CreateManyAsync([
            new CreateIndexModel<UserManagementAuditLogDocument>(Builders<UserManagementAuditLogDocument>.IndexKeys.Ascending(x => x.TargetUserId).Descending(x => x.Timestamp)),
            new CreateIndexModel<UserManagementAuditLogDocument>(Builders<UserManagementAuditLogDocument>.IndexKeys.Ascending(x => x.ActorId).Descending(x => x.Timestamp)),
            new CreateIndexModel<UserManagementAuditLogDocument>(Builders<UserManagementAuditLogDocument>.IndexKeys.Ascending(x => x.Timestamp), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(365) })
        ], cancellationToken);
    }
}
