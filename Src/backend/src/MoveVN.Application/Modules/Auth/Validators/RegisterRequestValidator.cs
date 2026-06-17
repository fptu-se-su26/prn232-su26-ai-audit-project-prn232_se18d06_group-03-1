using FluentValidation;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Phone)
            .NotEmpty()
            .Matches(@"^0\d{9}$")
            .WithMessage("Phone number must be exactly 10 digits and start with 0.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8);

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password)
            .WithMessage("Password confirmation does not match.");

        RuleFor(x => x.Role)
            .Must(role => role.Equals("Customer", StringComparison.OrdinalIgnoreCase)
                || role.Equals("Owner", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Only Customer or Owner can register publicly.");
    }
}
