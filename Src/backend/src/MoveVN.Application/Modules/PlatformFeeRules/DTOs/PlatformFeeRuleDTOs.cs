namespace MoveVN.Application.Modules.PlatformFeeRules.DTOs;

public class PlatformFeeRuleResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public long? TargetId { get; set; }
    public string FeeType { get; set; } = string.Empty;
    public decimal FeeValue { get; set; }
    public decimal? MinFee { get; set; }
    public decimal? MaxFee { get; set; }
    public int Priority { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreatePlatformFeeRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public long? TargetId { get; set; }
    public string FeeType { get; set; } = string.Empty;
    public decimal FeeValue { get; set; }
    public decimal? MinFee { get; set; }
    public decimal? MaxFee { get; set; }
    public int Priority { get; set; } = 100;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
}

public class UpdatePlatformFeeRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public long? TargetId { get; set; }
    public string FeeType { get; set; } = string.Empty;
    public decimal FeeValue { get; set; }
    public decimal? MinFee { get; set; }
    public decimal? MaxFee { get; set; }
    public int Priority { get; set; } = 100;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public bool IsActive { get; set; }
}
