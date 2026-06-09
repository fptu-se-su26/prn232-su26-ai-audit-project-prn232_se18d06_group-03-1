namespace MoveVN.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Status { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public T? Data { get; set; }

    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Succeeded(T? data, string message = "Success.", string code = "SUCCESS") => new()
    {
        Status = true,
        Code = code,
        Message = message,
        Data = data
    };

    public static ApiResponse<T> Failed(string code, string message, List<string>? errors = null) => new()
    {
        Status = false,
        Code = code,
        Message = message,
        Data = default,
        Errors = errors
    };
}
