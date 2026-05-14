using CookingCommunicate.Application.Common.Exceptions;
using CookingCommunicate.Application.Common.Models;
using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;

namespace CookingCommunicate.Api.Middleware;

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
            ValidationException validationException => new ApiResponse<object>
            {
                Success = false,
                Message = validationException.Message,
                Errors = validationException.Errors
            },
            NotFoundException => new ApiResponse<object>
            {
                Success = false,
                Message = exception.Message
            },
            _ => new ApiResponse<object>
            {
                Success = false,
                Message = "An unexpected error occurred."
            }
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            ValidationException => (int)HttpStatusCode.BadRequest,
            NotFoundException => (int)HttpStatusCode.NotFound,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var json = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(json);
    }
}
