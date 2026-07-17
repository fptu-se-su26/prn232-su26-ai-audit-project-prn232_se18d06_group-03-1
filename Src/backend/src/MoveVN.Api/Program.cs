using MoveVN.Api.Extensions;
using MoveVN.Api.Hubs;
using MoveVN.Api.Services;
using MoveVN.Application;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Infrastructure.Extensions;
using DotNetEnv;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.RateLimiting;

var envFilePath = FindEnvFile();
if (envFilePath is not null)
{
    Env.Load(envFilePath);
}

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var dataProtectionKeysPath = Path.Combine(builder.Environment.ContentRootPath, "..", "..", ".keys");
Directory.CreateDirectory(dataProtectionKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));

builder.Configuration["ConnectionStrings:DefaultConnection"] =
    GetRequiredEnvironmentVariable("DB_CONNECTION");
builder.Configuration["Jwt:Key"] = GetRequiredEnvironmentVariable("JWT_KEY");
builder.Configuration["Jwt:Issuer"] = GetRequiredEnvironmentVariable("JWT_ISSUER");
builder.Configuration["Jwt:Audience"] = GetRequiredEnvironmentVariable("JWT_AUDIENCE");
builder.Configuration["Jwt:ExpireMinutes"] = GetRequiredEnvironmentVariable("JWT_EXPIRE_MINUTES");
builder.Configuration["AI_VERIFICATION_API_KEY"] = GetRequiredEnvironmentVariable("AI_VERIFICATION_API_KEY");

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddFluentValidationAutoValidation(config => config.DisableDataAnnotationsValidation = true);
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();
builder.Services.AddScoped<INotificationRealtimeDispatcher, SignalRNotificationRealtimeDispatcher>();
builder.Services.AddScoped<IChatRealtimeDispatcher, SignalRChatRealtimeDispatcher>();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHostedService<PresenceCleanupService>();
builder.Services.AddHostedService<BookingAutoCancelBackgroundService>();

const string frontendCorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy(frontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => type.FullName?.Replace("+", "."));

    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MoveVN API",
        Version = "v1",
        Description = "Base ASP.NET Core Web API following Clean Architecture."
    });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        Description = "Input your JWT token in this format: Bearer {your token here}.",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    options.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrWhiteSpace(accessToken)
                    && (path.StartsWithSegments("/hubs/presence")
                        || path.StartsWithSegments("/hubs/notifications")
                        || path.StartsWithSegments("/hubs/chat")))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                var tokenSessionService = context.HttpContext.RequestServices.GetRequiredService<ITokenSessionService>();

                if (string.IsNullOrWhiteSpace(jti) || !await tokenSessionService.IsActiveAsync(jti, context.HttpContext.RequestAborted))
                {
                    context.Fail("Token session is inactive.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("NationalIdUpload", config =>
    {
        config.PermitLimit = 5;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 0;
    });
});

var app = builder.Build();

await app.ApplyDatabaseMigrationsAsync();

app.UseGlobalExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseCors(frontendCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<PresenceHub>("/hubs/presence");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

static string GetRequiredEnvironmentVariable(string key)
{
    return Environment.GetEnvironmentVariable(key)
        ?? throw new InvalidOperationException($"Required environment variable '{key}' is missing.");
}

static string? FindEnvFile()
{
    var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

    while (directory is not null)
    {
        var envFile = Path.Combine(directory.FullName, ".env");
        if (File.Exists(envFile))
        {
            return envFile;
        }

        directory = directory.Parent;
    }

    return null;
}
