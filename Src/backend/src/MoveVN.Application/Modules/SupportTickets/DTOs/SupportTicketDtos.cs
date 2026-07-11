namespace MoveVN.Application.Modules.SupportTickets.DTOs;

public class SupportTicketListRequest
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CreateSupportTicketRequest
{
    public string Category { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public string? AttachmentUrls { get; set; }
}

public class AddTicketMessageRequest
{
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrls { get; set; }
}

public class UpdateSupportTicketStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class SupportTicketListItem
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string TicketNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public string Priority { get; set; } = string.Empty;
    public int MessageCount { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SupportTicketDetailResponse : SupportTicketListItem
{
    public List<TicketMessageResponse> Messages { get; set; } = [];
}

public class TicketMessageResponse
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public List<string> SenderRoles { get; set; } = [];
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrls { get; set; }
    public DateTime CreatedAt { get; set; }
}
