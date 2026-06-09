using MoveVN.Application.Common.Errors;

namespace MoveVN.Application.Common.Exceptions;

public class AppException : Exception
{
    public ErrorCode ErrorCode { get; }
    public IReadOnlyList<string>? Errors { get; }

    public AppException(ErrorCode errorCode, IReadOnlyList<string>? errors = null)
        : base(errorCode.Message)
    {
        ErrorCode = errorCode;
        Errors = errors;
    }
}
