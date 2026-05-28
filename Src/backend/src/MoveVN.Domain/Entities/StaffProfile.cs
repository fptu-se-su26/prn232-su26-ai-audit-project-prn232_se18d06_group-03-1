namespace MoveVN.Domain.Entities;

public class StaffProfile
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string? Department { get; set; }
    public long? SupervisorId { get; set; }
}

