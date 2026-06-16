namespace MoveVN.Application.Modules.Auth.DTOs;

public class AuthLogDto
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public string? Email { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Success { get; set; }
    public string? FailReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuthLogQueryRequest
{
    public long? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? EventType { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
