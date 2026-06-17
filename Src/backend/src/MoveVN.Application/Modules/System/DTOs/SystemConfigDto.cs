namespace MoveVN.Application.Modules.System.DTOs;

public class SystemConfigDto
{
    public int Id { get; set; }
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateSystemConfigRequest
{
    public string ConfigValue { get; set; } = string.Empty;
}

public class AuditLogDto
{
    public long Id { get; set; }
    public long? ActorId { get; set; }
    public string? ActorRole { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public long? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuditLogQueryRequest
{
    public long? ActorId { get; set; }
    public string? EntityType { get; set; }
    public string? Action { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class DashboardKpiDto
{
    public int TotalUsers { get; set; }
    public int TotalVehiclesAvailable { get; set; }
    public int BookingsToday { get; set; }
    public decimal GmvThisMonth { get; set; }
    public double DisputeRate { get; set; }
    public int HighRiskBookings { get; set; }
    public decimal HighRiskRatio { get; set; }
    public List<DailyBookingDto> DailyBookings { get; set; } = new();
}

public class DailyBookingDto
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
    public decimal Revenue { get; set; }
}

public class TrustScoreDto
{
    public long UserId { get; set; }
    public decimal Score { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int CompletedTrips { get; set; }
    public int CancellationCount { get; set; }
    public int ReportCount { get; set; }
    public decimal? AverageRating { get; set; }
    public DateTime LastCalculatedAt { get; set; }
}

public class TrustScoreHistoryDto
{
    public decimal Score { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int CompletedTrips { get; set; }
    public int CancellationCount { get; set; }
    public int ReportCount { get; set; }
    public decimal? AverageRating { get; set; }
    public DateTime CalculatedAt { get; set; }
}
