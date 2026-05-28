using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class ChatRoomDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string BookingId { get; set; } = string.Empty;
    public string RoomType { get; set; } = "booking";
    public List<ChatParticipantDocument> Participants { get; set; } = [];
    public LastMessageDocument? LastMessage { get; set; }
    public Dictionary<string, int> UnreadCount { get; set; } = [];
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

