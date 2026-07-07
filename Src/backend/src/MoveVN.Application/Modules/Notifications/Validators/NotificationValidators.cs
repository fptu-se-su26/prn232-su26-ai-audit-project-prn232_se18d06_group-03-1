using FluentValidation;
using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Application.Modules.Notifications.Validators;

public class CreateNotificationRequestValidator : AbstractValidator<CreateNotificationRequest>
{
    public CreateNotificationRequestValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);
        RuleFor(x => x.Type).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Channel).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DataJson).MaximumLength(4000);
    }
}
