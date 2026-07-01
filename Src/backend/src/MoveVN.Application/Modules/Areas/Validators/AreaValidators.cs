using FluentValidation;
using MoveVN.Application.Modules.Areas.DTOs;

namespace MoveVN.Application.Modules.Areas.Validators;

public class CreateAreaRequestValidator : AbstractValidator<CreateAreaRequest>
{
    public CreateAreaRequestValidator()
    {
        RuleFor(x => x.Province)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.District)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.PricingRegionId)
            .GreaterThan(0);
    }
}

public class UpdateAreaRequestValidator : AbstractValidator<UpdateAreaRequest>
{
    public UpdateAreaRequestValidator()
    {
        RuleFor(x => x.Province)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.District)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.PricingRegionId)
            .GreaterThan(0);
    }
}
