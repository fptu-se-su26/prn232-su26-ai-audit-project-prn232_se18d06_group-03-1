using FluentValidation;
using MoveVN.Application.Modules.Admin.DTOs;

namespace MoveVN.Application.Modules.Admin.Validators;

public class CreateStaffRequestValidator : AbstractValidator<CreateStaffRequest>
{
    public CreateStaffRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password);
        RuleFor(x => x.EmployeeCode).NotEmpty().MaximumLength(50);
    }
}
