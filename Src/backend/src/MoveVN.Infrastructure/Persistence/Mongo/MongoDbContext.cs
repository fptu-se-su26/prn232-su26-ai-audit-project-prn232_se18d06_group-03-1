using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo.Migrations;

namespace MoveVN.Infrastructure.Persistence.Mongo;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<ChatRoomDocument> ChatRooms => _database.GetCollection<ChatRoomDocument>("ChatRooms");
    public IMongoCollection<ChatMessageDocument> ChatMessages => _database.GetCollection<ChatMessageDocument>("ChatMessages");
    public IMongoCollection<NotificationQueueDocument> NotificationQueue => _database.GetCollection<NotificationQueueDocument>("NotificationQueue");
    public IMongoCollection<PushTokenDocument> PushTokens => _database.GetCollection<PushTokenDocument>("PushTokens");
    public IMongoCollection<PricingRuleDocument> PricingRules => _database.GetCollection<PricingRuleDocument>("pricing_rules");
    public IMongoCollection<WeatherSnapshotDocument> WeatherSnapshots => _database.GetCollection<WeatherSnapshotDocument>("weather_snapshots");
    public IMongoCollection<DemandSnapshotDocument> DemandSnapshots => _database.GetCollection<DemandSnapshotDocument>("demand_snapshots");
    public IMongoCollection<PricingCalculationLogDocument> PricingCalculationLogs => _database.GetCollection<PricingCalculationLogDocument>("pricing_calculation_logs");
    public IMongoCollection<VehicleVerificationLogDocument> VehicleVerificationLogs => _database.GetCollection<VehicleVerificationLogDocument>("vehicle_verification_logs");
    public IMongoCollection<DriverLicenseVerificationLogDocument> DriverLicenseVerificationLogs => _database.GetCollection<DriverLicenseVerificationLogDocument>("driver_license_verification_logs");
    public IMongoCollection<UserActivityLogDocument> UserActivityLogs => _database.GetCollection<UserActivityLogDocument>("user_activity_logs");
    public IMongoCollection<SearchLogDocument> SearchLogs => _database.GetCollection<SearchLogDocument>("search_logs");
    public IMongoCollection<MongoMigrationHistory> MigrationHistory => _database.GetCollection<MongoMigrationHistory>("mongo_migrations");
}
