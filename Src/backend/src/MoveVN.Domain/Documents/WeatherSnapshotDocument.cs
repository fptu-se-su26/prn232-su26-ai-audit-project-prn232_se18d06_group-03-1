using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class WeatherSnapshotDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string AreaId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public int Hour { get; set; }
    public BsonDocument Data { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

