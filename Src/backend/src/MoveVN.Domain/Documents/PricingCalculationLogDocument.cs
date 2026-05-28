using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class PricingCalculationLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string VehicleId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public BsonDocument Input { get; set; } = [];
    public BsonDocument Output { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

