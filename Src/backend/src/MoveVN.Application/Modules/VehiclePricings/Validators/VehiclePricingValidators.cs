using FluentValidation;
using MoveVN.Application.Modules.VehiclePricings.DTOs;

namespace MoveVN.Application.Modules.VehiclePricings.Validators;

public class UpdateVehiclePricingRequestValidator : AbstractValidator<UpdateVehiclePricingRequest>
{
    public UpdateVehiclePricingRequestValidator()
    {
        RuleFor(x => x.PricingMode)
            .NotEmpty()
            .Must(x => x == PricingModes.Fixed || x == PricingModes.Auto);

        When(x => x.PricingMode == PricingModes.Fixed, () =>
        {
            RuleFor(x => x.FixedPricePerDay).NotNull().GreaterThan(0);
            RuleFor(x => x.AutoMinPrice).Null();
            RuleFor(x => x.AutoMaxPrice).Null();
        });

        When(x => x.PricingMode == PricingModes.Auto, () =>
        {
            RuleFor(x => x.AutoMinPrice).NotNull().GreaterThan(0);
            RuleFor(x => x.AutoMaxPrice).NotNull().GreaterThan(0);
            RuleFor(x => x.FixedPricePerDay).Null();
            RuleFor(x => x).Must(x => x.AutoMinPrice <= x.AutoMaxPrice)
                .WithMessage("AutoMinPrice must be less than or equal to AutoMaxPrice.");
        });
    }
}
