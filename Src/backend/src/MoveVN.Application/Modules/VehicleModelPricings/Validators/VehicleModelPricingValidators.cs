using FluentValidation;
using MoveVN.Application.Modules.VehicleModelPricings.DTOs;

namespace MoveVN.Application.Modules.VehicleModelPricings.Validators;

public class CreateVehicleModelPricingRequestValidator : AbstractValidator<CreateVehicleModelPricingRequest>
{
    public CreateVehicleModelPricingRequestValidator()
    {
        RuleFor(x => x.ModelId).GreaterThan(0);
        RuleFor(x => x.PricingRegionId).GreaterThan(0);
        RuleFor(x => x.SuggestedMinPrice).GreaterThan(0).PrecisionScale(15, 2, false);
        RuleFor(x => x.BasePrice).GreaterThan(0).PrecisionScale(15, 2, false);
        RuleFor(x => x.SuggestedMaxPrice).GreaterThan(0).PrecisionScale(15, 2, false);
        RuleFor(x => x).Must(x => x.SuggestedMinPrice <= x.BasePrice && x.BasePrice <= x.SuggestedMaxPrice)
            .WithMessage("SuggestedMinPrice <= BasePrice <= SuggestedMaxPrice is required.");
    }
}

public class UpdateVehicleModelPricingRequestValidator : AbstractValidator<UpdateVehicleModelPricingRequest>
{
    public UpdateVehicleModelPricingRequestValidator()
    {
        RuleFor(x => x.ModelId).GreaterThan(0);
        RuleFor(x => x.PricingRegionId).GreaterThan(0);
        RuleFor(x => x.SuggestedMinPrice).GreaterThan(0).PrecisionScale(15, 2, false);
        RuleFor(x => x.BasePrice).GreaterThan(0).PrecisionScale(15, 2, false);
        RuleFor(x => x.SuggestedMaxPrice).GreaterThan(0).PrecisionScale(15, 2, false);
        RuleFor(x => x).Must(x => x.SuggestedMinPrice <= x.BasePrice && x.BasePrice <= x.SuggestedMaxPrice)
            .WithMessage("SuggestedMinPrice <= BasePrice <= SuggestedMaxPrice is required.");
    }
}
