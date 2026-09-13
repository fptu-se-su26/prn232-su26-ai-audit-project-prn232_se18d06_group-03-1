using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MoveVN.Domain.Documents;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo.Migrations;

namespace MoveVN.Infrastructure.Persistence.Mongo;

public class MongoDbContext
{
    private readonly Lazy<IMongoDatabase> _databaseLazy;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        _databaseLazy = new Lazy<IMongoDatabase>(
            () => new MongoClient(settings.Value.ConnectionString).GetDatabase(settings.Value.DatabaseName),
            isThreadSafe: true);
    }

    public IMongoDatabase Database => _databaseLazy.Value;

    public IMongoCollection<ChatRoomDocument> ChatRooms => Database.GetCollection<ChatRoomDocument>("ChatRooms");
    public IMongoCollection<ChatMessageDocument> ChatMessages => Database.GetCollection<ChatMessageDocument>("ChatMessages");
    public IMongoCollection<NotificationQueueDocument> NotificationQueue => Database.GetCollection<NotificationQueueDocument>("NotificationQueue");
    public IMongoCollection<PushTokenDocument> PushTokens => Database.GetCollection<PushTokenDocument>("PushTokens");
    public IMongoCollection<PricingRuleDocument> PricingRules => Database.GetCollection<PricingRuleDocument>("pricing_rules");
    public IMongoCollection<WeatherSnapshotDocument> WeatherSnapshots => Database.GetCollection<WeatherSnapshotDocument>("weather_snapshots");
    public IMongoCollection<DemandSnapshotDocument> DemandSnapshots => Database.GetCollection<DemandSnapshotDocument>("demand_snapshots");
    public IMongoCollection<PricingCalculationLogDocument> PricingCalculationLogs => Database.GetCollection<PricingCalculationLogDocument>("pricing_calculation_logs");
    public IMongoCollection<VehicleVerificationLogDocument> VehicleVerificationLogs => Database.GetCollection<VehicleVerificationLogDocument>("vehicle_verification_logs");
    public IMongoCollection<DriverLicenseVerificationLogDocument> DriverLicenseVerificationLogs => Database.GetCollection<DriverLicenseVerificationLogDocument>("driver_license_verification_logs");
    public IMongoCollection<NationalIdVerificationLogDocument> NationalIdVerificationLogs => Database.GetCollection<NationalIdVerificationLogDocument>("national_id_verification_logs");
    public IMongoCollection<UserActivityLogDocument> UserActivityLogs => Database.GetCollection<UserActivityLogDocument>("user_activity_logs");
    public IMongoCollection<SearchLogDocument> SearchLogs => Database.GetCollection<SearchLogDocument>("search_logs");
    public IMongoCollection<UserManagementAuditLogDocument> UserManagementAuditLogs => Database.GetCollection<UserManagementAuditLogDocument>("user_management_audit_logs");
    public IMongoCollection<BroadcastNotificationLogDocument> BroadcastNotificationLogs => Database.GetCollection<BroadcastNotificationLogDocument>("broadcast_notification_logs");
    public IMongoCollection<MongoMigrationHistory> MigrationHistory => Database.GetCollection<MongoMigrationHistory>("mongo_migrations");
}
