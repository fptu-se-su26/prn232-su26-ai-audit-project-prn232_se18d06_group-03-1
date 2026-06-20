namespace MoveVN.Application.Modules.Owner.DTOs;

public class UpdateBankInfoRequest
{
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolderName { get; set; } = string.Empty;
}
