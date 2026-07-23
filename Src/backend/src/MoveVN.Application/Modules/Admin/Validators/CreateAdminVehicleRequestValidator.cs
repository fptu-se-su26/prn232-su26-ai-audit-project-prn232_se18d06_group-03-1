using FluentValidation;
using MoveVN.Application.Modules.Admin.DTOs;

namespace MoveVN.Application.Modules.Admin.Validators;

public class CreateAdminVehicleRequestValidator : AbstractValidator<CreateAdminVehicleRequest>
{
    public CreateAdminVehicleRequestValidator()
    {
        RuleFor(x => x.OwnerId).GreaterThan(0);
        RuleFor(x => x.BrandId).GreaterThan(0);
        RuleFor(x => x.ModelId).GreaterThan(0);
        RuleFor(x => x.VehicleType).NotEmpty().Must(t => t == "Car" || t == "Motorbike")
            .WithMessage("VehicleType must be 'Car' or 'Motorbike'.");
        RuleFor(x => x.Year).InclusiveBetween((short)1990, (short)(DateTime.UtcNow.Year + 1));
        RuleFor(x => x.LicensePlate).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.PricePerDay).GreaterThan(0);
        RuleFor(x => x.DepositPercent).InclusiveBetween(20, 50);
        RuleFor(x => x.SecurityDepositAmount).GreaterThan(0).When(x => x.SecurityRequiresDeposit)
            .WithMessage("Số tiền thế chấp phải lớn hơn 0.");
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.OdometerKm).GreaterThanOrEqualTo(0).When(x => x.OdometerKm.HasValue);
        RuleFor(x => x.PricingMode).Must(m => m == null || m == "Fixed" || m == "Auto")
            .WithMessage("PricingMode must be 'Fixed' or 'Auto'.");
        RuleFor(x => x.FixedPricePerDay).GreaterThan(0).When(x => x.PricingMode == "Fixed");
        RuleFor(x => x.AutoMinPrice).GreaterThanOrEqualTo(0).When(x => x.PricingMode == "Auto");
        RuleFor(x => x.AutoMaxPrice).GreaterThanOrEqualTo(0).When(x => x.PricingMode == "Auto");
        RuleFor(x => x.FeatureIds).NotNull();
        RuleFor(x => x.ImageUrls).NotNull();
    }
}
