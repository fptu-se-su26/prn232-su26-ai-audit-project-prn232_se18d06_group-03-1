using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MoveVN.Domain.Documents;

public class SearchLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string? UserId { get; set; }
    public BsonDocument Query { get; set; } = [];
    public int ResultsCount { get; set; }
    public string? ClickedVehicleId { get; set; }
    public string? ConvertedBookingId { get; set; }
    public int? SearchDurationMs { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

