using FluentValidation;
using MoveVN.Application.Modules.Admin.DTOs;

namespace MoveVN.Application.Modules.Admin.Validators;

public sealed class AdminCreateCustomerRequestValidator : AbstractValidator<AdminCreateCustomerRequest>
{
    public AdminCreateCustomerRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password);
    }
}

public sealed class AdminCreateOwnerRequestValidator : AbstractValidator<AdminCreateOwnerRequest>
{
    public AdminCreateOwnerRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password);
        RuleFor(x => x.NationalId).NotEmpty().MaximumLength(30);
        RuleFor(x => x.DriverLicenseNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DriverLicenseClass).NotEmpty().MaximumLength(20);
        RuleFor(x => x.DriverLicenseVehicleType)
            .Must(x => x is "Car" or "Motorbike")
            .WithMessage("Loại phương tiện GPLX phải là Car hoặc Motorbike.");
        RuleFor(x => x.BankName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.BankAccountNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.BankAccountHolderName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.NationalIdFrontImage.Content).NotEmpty();
        RuleFor(x => x.DriverLicenseFrontImage.Content).NotEmpty();
    }
}
