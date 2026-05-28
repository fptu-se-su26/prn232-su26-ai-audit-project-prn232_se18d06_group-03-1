namespace MoveVN.Domain.Entities;

public class FeatureFlag
{
    public int Id { get; set; }
    public string FlagKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public byte RolloutPercent { get; set; }
    public string? AllowedRoles { get; set; }
    public string? Description { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

