namespace MoveVN.Application.Modules.Chats.DTOs;

public class ChatRoomListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SendChatMessageRequest
{
    public string Content { get; set; } = string.Empty;
}

public class ChatParticipantResponse
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class ChatLastMessageResponse
{
    public string Text { get; set; } = string.Empty;
    public long SenderId { get; set; }
    public DateTime SentAt { get; set; }
}

public class ChatRoomResponse
{
    public string Id { get; set; } = string.Empty;
    public long BookingId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public long CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public long VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public List<ChatParticipantResponse> Participants { get; set; } = [];
    public ChatLastMessageResponse? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ChatMessageResponse
{
    public string Id { get; set; } = string.Empty;
    public string RoomId { get; set; } = string.Empty;
    public long BookingId { get; set; }
    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string MessageType { get; set; } = "text";
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}

public class ChatMessageCreatedPayload
{
    public ChatMessageResponse Message { get; set; } = new();
    public ChatRoomResponse Room { get; set; } = new();
}
