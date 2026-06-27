using FluentValidation;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.VehiclePricings.DTOs;

namespace MoveVN.Application.Modules.PricingRules.Validators;

public class CreatePricingRuleRequestValidator : AbstractValidator<CreatePricingRuleRequest>
{
    public CreatePricingRuleRequestValidator()
    {
        RuleFor(x => x.VehicleId).GreaterThan(0);
        RuleFor(x => x.RuleType)
            .NotEmpty()
            .Must(x => x == PricingRuleTypes.Multiplier || x == PricingRuleTypes.FixedPrice);
        RuleFor(x => x.Priority).InclusiveBetween(0, 10000);
        RuleFor(x => x).Must(x => !x.StartDate.HasValue || !x.EndDate.HasValue || x.StartDate <= x.EndDate)
            .WithMessage("StartDate must be less than or equal to EndDate.");

        When(x => x.RuleType == PricingRuleTypes.Multiplier, () =>
        {
            RuleFor(x => x.Multiplier).NotNull().GreaterThan(0);
            RuleFor(x => x.FixedPrice).Null();
        });

        When(x => x.RuleType == PricingRuleTypes.FixedPrice, () =>
        {
            RuleFor(x => x.FixedPrice).NotNull().GreaterThan(0);
            RuleFor(x => x.Multiplier).Null();
        });
    }
}

public class UpdatePricingRuleRequestValidator : AbstractValidator<UpdatePricingRuleRequest>
{
    public UpdatePricingRuleRequestValidator()
    {
        RuleFor(x => x.VehicleId).GreaterThan(0);
        RuleFor(x => x.RuleType)
            .NotEmpty()
            .Must(x => x == PricingRuleTypes.Multiplier || x == PricingRuleTypes.FixedPrice);
        RuleFor(x => x.Priority).InclusiveBetween(0, 10000);
        RuleFor(x => x).Must(x => !x.StartDate.HasValue || !x.EndDate.HasValue || x.StartDate <= x.EndDate)
            .WithMessage("StartDate must be less than or equal to EndDate.");

        When(x => x.RuleType == PricingRuleTypes.Multiplier, () =>
        {
            RuleFor(x => x.Multiplier).NotNull().GreaterThan(0);
            RuleFor(x => x.FixedPrice).Null();
        });

        When(x => x.RuleType == PricingRuleTypes.FixedPrice, () =>
        {
            RuleFor(x => x.FixedPrice).NotNull().GreaterThan(0);
            RuleFor(x => x.Multiplier).Null();
        });
    }
}
