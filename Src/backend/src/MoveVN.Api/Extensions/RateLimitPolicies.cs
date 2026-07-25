using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace MoveVN.Api.Extensions;

public static class RateLimitPolicies
{
    public static void AddAuthPolicies(this RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.OnRejected = async (context, cancellationToken) =>
        {
            context.HttpContext.Response.ContentType = "application/json";
            var response = new
            {
                Status = false,
                Code = "429",
                Message = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
                Data = (object?)null,
                Errors = (List<string>?)null
            };
            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            await context.HttpContext.Response.WriteAsync(json, cancellationToken);
        };

        options.AddFixedWindowLimiter("AuthLogin", config =>
        {
            config.PermitLimit = 5;
            config.Window = TimeSpan.FromMinutes(1);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthRegister", config =>
        {
            config.PermitLimit = 3;
            config.Window = TimeSpan.FromMinutes(5);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthForgotPassword", config =>
        {
            config.PermitLimit = 3;
            config.Window = TimeSpan.FromMinutes(5);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthResetPassword", config =>
        {
            config.PermitLimit = 3;
            config.Window = TimeSpan.FromMinutes(5);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthVerifyOtp", config =>
        {
            config.PermitLimit = 5;
            config.Window = TimeSpan.FromMinutes(2);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthResendOtp", config =>
        {
            config.PermitLimit = 3;
            config.Window = TimeSpan.FromMinutes(5);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthChangePassword", config =>
        {
            config.PermitLimit = 5;
            config.Window = TimeSpan.FromMinutes(1);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("AuthRefresh", config =>
        {
            config.PermitLimit = 10;
            config.Window = TimeSpan.FromMinutes(1);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });
    }

    public static void AddMiscPolicies(this RateLimiterOptions options)
    {
        options.AddFixedWindowLimiter("NationalIdUpload", config =>
        {
            config.PermitLimit = 5;
            config.Window = TimeSpan.FromMinutes(1);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("PublicVehicleSearch", config =>
        {
            config.PermitLimit = 30;
            config.Window = TimeSpan.FromMinutes(1);
            config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            config.QueueLimit = 0;
        });
    }
}
