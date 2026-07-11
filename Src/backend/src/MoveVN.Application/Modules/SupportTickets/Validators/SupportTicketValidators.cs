using FluentValidation;
using MoveVN.Application.Modules.SupportTickets.DTOs;

namespace MoveVN.Application.Modules.SupportTickets.Validators;

public class CreateSupportTicketRequestValidator : AbstractValidator<CreateSupportTicketRequest>
{
    public CreateSupportTicketRequestValidator()
    {
        RuleFor(x => x.Category)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(x => x.Subject)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Message)
            .NotEmpty()
            .MaximumLength(4000);

        RuleFor(x => x.Priority)
            .NotEmpty()
            .Must(value => !string.IsNullOrWhiteSpace(value)
                && SupportTicketValidatorOptions.Priorities.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Priority must be Low, Normal, High, or Urgent.");

        RuleFor(x => x.AttachmentUrls)
            .MaximumLength(4000);
    }
}

public class AddTicketMessageRequestValidator : AbstractValidator<AddTicketMessageRequest>
{
    public AddTicketMessageRequestValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .MaximumLength(4000);

        RuleFor(x => x.AttachmentUrls)
            .MaximumLength(4000);
    }
}

public class UpdateSupportTicketStatusRequestValidator : AbstractValidator<UpdateSupportTicketStatusRequest>
{
    public UpdateSupportTicketStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(value => !string.IsNullOrWhiteSpace(value)
                && SupportTicketValidatorOptions.Statuses.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Status must be Open, InProgress, Resolved, or Closed.");
    }
}

internal static class SupportTicketValidatorOptions
{
    public static readonly string[] Priorities = ["Low", "Normal", "High", "Urgent"];
    public static readonly string[] Statuses = ["Open", "InProgress", "Resolved", "Closed"];
}
