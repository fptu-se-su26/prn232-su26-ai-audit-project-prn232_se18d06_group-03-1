namespace MoveVN.Application.Common.Exceptions;

public class ValidationException : Exception
{
    public ValidationException(IEnumerable<string> errors)
        : base("One or more validation failures have occurred.")
    {
        Errors = errors.ToList();
    }

    public List<string> Errors { get; }
}
