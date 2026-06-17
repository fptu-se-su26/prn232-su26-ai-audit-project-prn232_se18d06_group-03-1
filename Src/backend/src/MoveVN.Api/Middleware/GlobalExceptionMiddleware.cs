using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;

namespace MoveVN.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception occurred while processing request {Path}.", context.Request.Path);
            await HandleExceptionAsync(context, exception);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = exception switch
        {
            AppException appException => new ApiResponse<object>
            {
                Status = false,
                Code = appException.ErrorCode.Code,
                Message = appException.ErrorCode.Message,
                Errors = appException.Errors?.ToList()
            },
            ValidationException validationException => new ApiResponse<object>
            {
                Status = false,
                Code = "422",
                Message = validationException.Message,
                Errors = validationException.Errors
            },
            NotFoundException => new ApiResponse<object>
            {
                Status = false,
                Code = "404",
                Message = exception.Message
            },
            _ => new ApiResponse<object>
            {
                Status = false,
                Code = "500",
                Message = "An unexpected error occurred."
            }
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            AppException appException => (int)appException.ErrorCode.HttpCode,
            ValidationException => (int)HttpStatusCode.BadRequest,
            NotFoundException => (int)HttpStatusCode.NotFound,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        return context.Response.WriteAsync(json);
    }
}
