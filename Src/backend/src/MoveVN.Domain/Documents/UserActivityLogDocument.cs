using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class UserActivityLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string? UserId { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string Event { get; set; } = string.Empty;
    public BsonDocument? Properties { get; set; }
    public string? Page { get; set; }
    public string? Referrer { get; set; }
    public string? DeviceType { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

