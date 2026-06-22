namespace MoveVN.Application.Modules.Owner.DTOs;

public class OwnerOnboardingRegisterResponse
{
    public long UserId { get; set; }
    public long OwnerApplicationId { get; set; }
    public string NextStep { get; set; } = string.Empty;
}
