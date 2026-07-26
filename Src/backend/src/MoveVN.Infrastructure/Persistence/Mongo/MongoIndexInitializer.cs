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
        await EnsureUniqueActiveBookingRoomIndexAsync(cancellationToken);

        await _context.ChatRooms.Indexes.CreateManyAsync([
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

        await _context.BroadcastNotificationLogs.Indexes.CreateManyAsync([
            new CreateIndexModel<BroadcastNotificationLogDocument>(Builders<BroadcastNotificationLogDocument>.IndexKeys.Ascending(x => x.SenderId).Descending(x => x.Timestamp)),
            new CreateIndexModel<BroadcastNotificationLogDocument>(Builders<BroadcastNotificationLogDocument>.IndexKeys.Ascending(x => x.Timestamp), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(365) })
        ], cancellationToken);
    }

    private async Task EnsureUniqueActiveBookingRoomIndexAsync(CancellationToken cancellationToken)
    {
        var activeRooms = await _context.ChatRooms
            .Find(room => room.IsActive && room.BookingId != string.Empty)
            .ToListAsync(cancellationToken);

        foreach (var duplicateGroup in activeRooms
                     .GroupBy(room => room.BookingId, StringComparer.Ordinal)
                     .Where(group => group.Count() > 1))
        {
            var canonical = duplicateGroup
                .OrderByDescending(room => room.LastMessage?.SentAt ?? room.UpdatedAt)
                .ThenByDescending(room => room.UpdatedAt)
                .First();
            var duplicateIds = duplicateGroup
                .Where(room => room.Id != canonical.Id)
                .Select(room => room.Id)
                .Where(id => id is not null)
                .ToList();

            if (duplicateIds.Count == 0)
            {
                continue;
            }

            await _context.ChatMessages.UpdateManyAsync(
                Builders<ChatMessageDocument>.Filter.In(message => message.RoomId, duplicateIds!),
                Builders<ChatMessageDocument>.Update.Set(message => message.RoomId, canonical.Id!),
                cancellationToken: cancellationToken);
            await _context.ChatRooms.UpdateManyAsync(
                Builders<ChatRoomDocument>.Filter.In(room => room.Id, duplicateIds),
                Builders<ChatRoomDocument>.Update
                    .Set(room => room.IsActive, false)
                    .Set(room => room.UpdatedAt, DateTime.UtcNow),
                cancellationToken: cancellationToken);
        }

        using var indexes = await _context.ChatRooms.Indexes.ListAsync(cancellationToken);
        var existingIndexes = await indexes.ToListAsync(cancellationToken);
        foreach (var index in existingIndexes)
        {
            var indexName = index["name"].AsString;
            if (indexName is "_id_" or "ux_chat_rooms_active_booking")
            {
                continue;
            }

            var key = index["key"].AsBsonDocument;
            if (key.ElementCount == 1 && key.Contains(nameof(ChatRoomDocument.BookingId)))
            {
                await _context.ChatRooms.Indexes.DropOneAsync(indexName, cancellationToken);
            }
        }

        await _context.ChatRooms.Indexes.CreateOneAsync(
            new CreateIndexModel<ChatRoomDocument>(
                Builders<ChatRoomDocument>.IndexKeys.Ascending(room => room.BookingId),
                new CreateIndexOptions<ChatRoomDocument>
                {
                    Name = "ux_chat_rooms_active_booking",
                    Unique = true,
                    PartialFilterExpression = Builders<ChatRoomDocument>.Filter.And(
                        Builders<ChatRoomDocument>.Filter.Eq(room => room.IsActive, true),
                        Builders<ChatRoomDocument>.Filter.Gt(room => room.BookingId, string.Empty))
                }),
            cancellationToken: cancellationToken);
    }
}
