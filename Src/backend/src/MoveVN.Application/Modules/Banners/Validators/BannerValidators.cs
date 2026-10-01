using FluentValidation;
using MoveVN.Application.Modules.Banners.DTOs;
using MoveVN.Application.Modules.Banners.Services;

namespace MoveVN.Application.Modules.Banners.Validators;

public class CreateBannerRequestValidator : AbstractValidator<CreateBannerRequest>
{
    public CreateBannerRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ImageUrl).NotEmpty().MaximumLength(2000)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            .WithMessage("ImageUrl phải là URL http(s) hợp lệ.");
        RuleFor(x => x.PopupTitle).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PopupDescription).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.PopupCtaLabel).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x)
            .Must(x => BannerRules.IsValidDateRange(x.StartAt, x.EndAt))
            .WithMessage("StartAt phải trước EndAt.")
            .WithName("StartAt");
    }
}

public class UpdateBannerRequestValidator : AbstractValidator<UpdateBannerRequest>
{
    public UpdateBannerRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().MaximumLength(200)
            .When(x => x.Title is not null);
        RuleFor(x => x.ImageUrl)
            .NotEmpty().MaximumLength(2000)
            .Must(url => Uri.TryCreate(url!, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            .WithMessage("ImageUrl phải là URL http(s) hợp lệ.")
            .When(x => x.ImageUrl is not null);
        RuleFor(x => x.PopupTitle)
            .NotEmpty().MaximumLength(200)
            .When(x => x.PopupTitle is not null);
        RuleFor(x => x.PopupDescription)
            .NotEmpty().MaximumLength(2000)
            .When(x => x.PopupDescription is not null);
        RuleFor(x => x.PopupCtaLabel)
            .NotEmpty().MaximumLength(100)
            .When(x => x.PopupCtaLabel is not null);
        RuleFor(x => x.DisplayOrder!.Value)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DisplayOrder.HasValue);
        RuleFor(x => x)
            .Must(x => BannerRules.IsValidDateRange(
                x.ClearStartAt ? null : x.StartAt,
                x.ClearEndAt ? null : x.EndAt))
            .WithMessage("StartAt phải trước EndAt.")
            .WithName("StartAt");
    }
}
