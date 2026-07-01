namespace MoveVN.Application.Modules.Areas.DTOs;

public class AreaResponse
{
    public int Id { get; set; }
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public string PricingRegionCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateAreaRequest
{
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
}

public class UpdateAreaRequest
{
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public bool IsActive { get; set; }
}
