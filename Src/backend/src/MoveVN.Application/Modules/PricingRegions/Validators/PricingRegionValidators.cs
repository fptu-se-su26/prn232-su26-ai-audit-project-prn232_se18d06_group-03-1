using FluentValidation;
using MoveVN.Application.Modules.PricingRegions.DTOs;

namespace MoveVN.Application.Modules.PricingRegions.Validators;

public class CreatePricingRegionRequestValidator : AbstractValidator<CreatePricingRegionRequest>
{
    public CreatePricingRegionRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50)
            .Matches("^[A-Za-z0-9_-]+$");

        RuleFor(x => x.Description)
            .MaximumLength(255);
    }
}

public class UpdatePricingRegionRequestValidator : AbstractValidator<UpdatePricingRegionRequest>
{
    public UpdatePricingRegionRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50)
            .Matches("^[A-Za-z0-9_-]+$");

        RuleFor(x => x.Description)
            .MaximumLength(255);
    }
}
