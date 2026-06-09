using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Infrastructure.Persistence.Mongo.Migrations;

public class MongoMigrationHistory
{
    [BsonId]
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
}
