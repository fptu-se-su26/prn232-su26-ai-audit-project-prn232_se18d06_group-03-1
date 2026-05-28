using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class PricingRuleDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string RuleCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public BsonDocument Rule { get; set; } = [];
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

