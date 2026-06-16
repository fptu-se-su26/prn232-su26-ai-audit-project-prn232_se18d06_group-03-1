using Hangfire;
using Hangfire.PostgreSql;
using MoveVN.Api.Extensions;
using MoveVN.Api.Hubs;
using MoveVN.Api.Services;
using MoveVN.Application;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Infrastructure.Extensions;
using MoveVN.Infrastructure.Persistence;
using DotNetEnv;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;

var envFilePath = FindEnvFile();
if (envFilePath is not null)
{
    Env.Load(envFilePath);
}

var builder = WebApplication.CreateBuilder(args);

builder.Configuration["ConnectionStrings:DefaultConnection"] =
    GetRequiredEnvironmentVariable("DB_CONNECTION");
builder.Configuration["Jwt:Key"] = GetRequiredEnvironmentVariable("JWT_KEY");
builder.Configuration["Jwt:Issuer"] = GetRequiredEnvironmentVariable("JWT_ISSUER");
builder.Configuration["Jwt:Audience"] = GetRequiredEnvironmentVariable("JWT_AUDIENCE");
builder.Configuration["Jwt:ExpireMinutes"] = GetRequiredEnvironmentVariable("JWT_EXPIRE_MINUTES");

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddFluentValidationAutoValidation(config => config.DisableDataAnnotationsValidation = true);
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
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
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();

var hangfireConn = GetRequiredEnvironmentVariable("DB_CONNECTION");
builder.Services.AddHangfire(config => config.UsePostgreSqlStorage(hangfireConn));
builder.Services.AddHangfireServer();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("Fixed", cfg =>
    {
        cfg.PermitLimit = 100;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        cfg.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddMemoryCache();
builder.Services.AddScoped<INotificationHub, NotificationHubForwarder>();

var app = builder.Build();

app.UseGlobalExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<UserPresenceHub>("/hubs/presence");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

using (var scope = app.Services.CreateScope())
{
    // Ensure AuthLogs table exists (added after initial migration)
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "AuthLogs" (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY,
            user_id BIGINT NULL,
            email TEXT NULL,
            event_type TEXT NOT NULL DEFAULT '',
            ip_address TEXT NULL,
            user_agent TEXT NULL,
            device_info TEXT NULL,
            success BOOLEAN NOT NULL DEFAULT FALSE,
            fail_reason TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT "PK_AuthLogs" PRIMARY KEY (id),
            CONSTRAINT "FK_AuthLogs_Users_user_id" FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS "IX_AuthLogs_user_id" ON "AuthLogs"(user_id);
        CREATE INDEX IF NOT EXISTS "IX_AuthLogs_created_at" ON "AuthLogs"(created_at DESC);
    """);

    await SeedData.InitializeAsync(scope.ServiceProvider);
}

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
