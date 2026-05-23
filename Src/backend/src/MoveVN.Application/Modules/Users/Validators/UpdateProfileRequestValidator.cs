using FluentValidation;
using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Users.Validators;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);
    }
}
