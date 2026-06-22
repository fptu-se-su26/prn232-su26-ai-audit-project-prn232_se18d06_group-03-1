using FluentValidation;
using MoveVN.Application.Modules.Owner.DTOs;

namespace MoveVN.Application.Modules.Owner.Validators;

public class UpdateBankInfoRequestValidator : AbstractValidator<UpdateBankInfoRequest>
{
    public UpdateBankInfoRequestValidator()
    {
        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("Bank name is required.")
            .MaximumLength(200);

        RuleFor(x => x.BankAccountNumber)
            .NotEmpty().WithMessage("Bank account number is required.")
            .MaximumLength(50);

        RuleFor(x => x.BankAccountHolderName)
            .NotEmpty().WithMessage("Bank account holder name is required.")
            .MaximumLength(200);
    }
}
