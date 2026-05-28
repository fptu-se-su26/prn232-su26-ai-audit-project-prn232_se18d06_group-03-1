using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class ChatMessageDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonRepresentation(BsonType.ObjectId)]
    public string RoomId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string MessageType { get; set; } = "text";
    public string? Content { get; set; }
    public List<MessageAttachmentDocument> Attachments { get; set; } = [];
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ReplyTo { get; set; }
    public bool IsRead { get; set; }
    public List<MessageReadReceiptDocument> ReadBy { get; set; } = [];
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}

