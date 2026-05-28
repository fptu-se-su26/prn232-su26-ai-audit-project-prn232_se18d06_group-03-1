using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class DemandSnapshotDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string AreaId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public BsonDocument Metrics { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

