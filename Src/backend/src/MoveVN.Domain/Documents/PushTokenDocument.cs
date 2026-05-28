using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class PushTokenDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string FcmToken { get; set; } = string.Empty;
    public string? AppVersion { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

