using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class VehicleVerificationLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public long VehicleId { get; set; }
    public long VehicleDocumentId { get; set; }
    public long OwnerId { get; set; }
    public string Provider { get; set; } = "AI_VERIFICATION";
    public string DocumentType { get; set; } = "VehicleRegistration";
    public BsonDocument? Request { get; set; }
    public BsonDocument? Response { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
    public decimal? OcrConfidence { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
    public string? FilePublicId { get; set; }
    public DateTime? FileDeletedAt { get; set; }
    public string? DeletionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
