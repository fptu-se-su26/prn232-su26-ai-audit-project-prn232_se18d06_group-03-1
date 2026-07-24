using FluentValidation;
using MoveVN.Application.Modules.CmsPages.DTOs;

namespace MoveVN.Application.Modules.CmsPages.Validators;

public class CreateCmsPageRequestValidator : AbstractValidator<CreateCmsPageRequest>
{
    public CreateCmsPageRequestValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(100).Matches("^[a-z0-9-]+$");
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty();
    }
}

public class UpdateCmsPageRequestValidator : AbstractValidator<UpdateCmsPageRequest>
{
    public UpdateCmsPageRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty();
    }
}
