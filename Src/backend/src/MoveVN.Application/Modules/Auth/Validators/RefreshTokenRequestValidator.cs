using FluentValidation;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Validators;

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
