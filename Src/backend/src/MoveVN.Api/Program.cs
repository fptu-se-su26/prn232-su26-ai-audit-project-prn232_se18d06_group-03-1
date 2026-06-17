using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authorization;
using MoveVN.Api.Extensions;
using MoveVN.Api.Hubs;
using MoveVN.Api.Services;
using MoveVN.Api.Authorization;
using MoveVN.Application;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
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

builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("staff.verify", policy => policy.RequireRole("Staff", "Admin")
        .AddRequirements(new PermissionRequirement("staff.verify")));
    options.AddPolicy("staff.inspect", policy => policy.RequireRole("Staff", "Admin")
        .AddRequirements(new PermissionRequirement("staff.inspect")));
    options.AddPolicy("staff.dispute", policy => policy.RequireRole("Staff", "Admin")
        .AddRequirements(new PermissionRequirement("staff.dispute")));
    options.AddPolicy("admin.dashboard", policy => policy.RequireRole("Admin")
        .AddRequirements(new PermissionRequirement("admin.dashboard")));
});

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
builder.Services.AddHttpClient("ml-risk");
builder.Services.AddHttpClient("ml-pricing");

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

        CREATE TABLE IF NOT EXISTS "StaffPermissions" (
            "UserId" BIGINT NOT NULL,
            "PermissionCode" TEXT NOT NULL,
            "AssignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT "PK_StaffPermissions" PRIMARY KEY ("UserId", "PermissionCode"),
            CONSTRAINT "FK_StaffPermissions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users"(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "TrustScoreHistories" (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY,
            "UserId" BIGINT NOT NULL,
            "Score" NUMERIC(15,2) NOT NULL DEFAULT 0,
            "Tier" TEXT NOT NULL DEFAULT '',
            "CompletedTrips" INT NOT NULL DEFAULT 0,
            "CancellationCount" INT NOT NULL DEFAULT 0,
            "ReportCount" INT NOT NULL DEFAULT 0,
            "AverageRating" NUMERIC(5,2) NULL,
            "CalculatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT "PK_TrustScoreHistories" PRIMARY KEY (id),
            CONSTRAINT "FK_TrustScoreHistories_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users"(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_TrustScoreHistories_UserId" ON "TrustScoreHistories"("UserId");

        CREATE TABLE IF NOT EXISTS "DisputeEvidences" (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY,
            "DisputeId" BIGINT NOT NULL,
            "EvidenceUrl" TEXT NOT NULL DEFAULT '',
            "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT "PK_DisputeEvidences" PRIMARY KEY (id),
            CONSTRAINT "FK_DisputeEvidences_Disputes_DisputeId" FOREIGN KEY ("DisputeId") REFERENCES "Disputes"(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_DisputeEvidences_DisputeId" ON "DisputeEvidences"("DisputeId");
    """);

    await SeedData.InitializeAsync(scope.ServiceProvider);
}

RecurringJob.AddOrUpdate<IBookingService>(
    "booking-auto-cancel",
    service => service.AutoCancelExpiredAsync(CancellationToken.None),
    Cron.Hourly());

RecurringJob.AddOrUpdate<ITrustScoreService>(
    "trust-score-recalculate",
    service => service.RecalculateAllAsync(CancellationToken.None),
    "0 2 * * *");

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
