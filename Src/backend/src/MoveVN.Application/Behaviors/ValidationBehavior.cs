using FluentValidation;

namespace MoveVN.Application.Behaviors;

public class ValidationBehavior<T>
{
    private readonly IEnumerable<IValidator<T>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<T>> validators)
    {
        _validators = validators;
    }

    public async Task ValidateAsync(T instance, CancellationToken cancellationToken = default)
    {
        if (!_validators.Any())
        {
            return;
        }

        var context = new ValidationContext<T>(instance);
        var validationResults = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, cancellationToken)));
        var failures = validationResults
            .SelectMany(result => result.Errors)
            .Where(error => error is not null)
            .Select(error => error.ErrorMessage)
            .Distinct()
            .ToList();

        if (failures.Count != 0)
        {
            throw new Common.Exceptions.ValidationException(failures);
        }
    }
}
