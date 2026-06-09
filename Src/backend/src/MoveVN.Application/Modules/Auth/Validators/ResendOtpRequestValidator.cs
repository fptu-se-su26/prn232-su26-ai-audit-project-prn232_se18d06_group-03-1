using FluentValidation;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Validators;

public class ResendOtpRequestValidator : AbstractValidator<ResendOtpRequest>
{
    public ResendOtpRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Purpose).NotEmpty();
    }
}
