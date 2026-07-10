using MoveVN.Application.Common.Errors;

namespace MoveVN.Application.Common.Exceptions;

public class AppException : Exception
{
    public ErrorCode ErrorCode { get; }
    public IReadOnlyList<string>? Errors { get; }
    public object? Data { get; }

    public AppException(ErrorCode errorCode, IReadOnlyList<string>? errors = null, object? data = null)
        : base(errorCode.Message)
    {
        ErrorCode = errorCode;
        Errors = errors;
        Data = data;
    }
}
