using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class BroadcastNotificationLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;

    public string TargetType { get; set; } = string.Empty;
    public List<string> TargetRoles { get; set; } = [];
    public List<long> TargetUserIds { get; set; } = [];

    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
