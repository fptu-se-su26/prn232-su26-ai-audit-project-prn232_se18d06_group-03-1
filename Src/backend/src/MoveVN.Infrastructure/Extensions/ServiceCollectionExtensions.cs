using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Contracts.Interfaces;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Application.Modules.Reviews.Interfaces;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Infrastructure.Services;
using MoveVN.Infrastructure.Identity;
using MoveVN.Infrastructure.Identity.Services;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Repositories;
using MoveVN.Infrastructure.Persistence.Repositories.Auth;
using MoveVN.Infrastructure.Persistence.Repositories.Bookings;
using MoveVN.Infrastructure.Persistence.Repositories.Contracts;
using MoveVN.Infrastructure.Persistence.Repositories.Notifications;
using MoveVN.Infrastructure.Persistence.Repositories.Payments;
using MoveVN.Infrastructure.Persistence.Repositories.Reports;
using MoveVN.Infrastructure.Persistence.Repositories.Reviews;
using MoveVN.Infrastructure.Persistence.Repositories.System;
using MoveVN.Infrastructure.Persistence.Repositories.Users;
using MoveVN.Infrastructure.Persistence.Repositories.Vehicles;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MoveVN.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
                npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
            .UseSnakeCaseNamingConvention());

        services
            .AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped(typeof(IGenericRepository<>), typeof(Persistence.Repositories.GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPermissionService, PermissionService>();

        // ─── Auth repositories ────────────────────────────────────────────────
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAuthLogRepository, AuthLogRepository>();

        // ─── Auth services ──────────────────────────────────────────────────────
        services.AddScoped<IAesEncryptionService, AesEncryptionService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IRateLimitService, RateLimitService>();

        // ─── Vehicle repositories ──────────────────────────────────────────────
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<IBlockedDateRepository, BlockedDateRepository>();

        // ─── Vehicle services ──────────────────────────────────────────────────
        services.AddScoped<ICloudinaryService, CloudinaryService>();

        // ─── Booking repositories ──────────────────────────────────────────────
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IInspectionRepository, InspectionRepository>();

        // ─── Contract repositories & services ──────────────────────────────────
        services.AddScoped<IContractRepository, ContractRepository>();
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();

        // ─── Payment repositories ──────────────────────────────────────────────
        services.AddScoped<IPaymentRepository, PaymentRepository>();

        // ─── Notification repositories & services ──────────────────────────────
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationHub, NotificationHub>();

        // ─── Report repositories ───────────────────────────────────────────────
        services.AddScoped<IDisputeRepository, DisputeRepository>();
        services.AddScoped<ISupportTicketRepository, SupportTicketRepository>();

        // ─── Review repositories ───────────────────────────────────────────────
        services.AddScoped<IReviewRepository, ReviewRepository>();

        // ─── User repositories ─────────────────────────────────────────────────
        services.AddScoped<IVerificationRepository, VerificationRepository>();
        services.AddScoped<IAdminUserRepository, AdminUserRepository>();

        // ─── System repositories ───────────────────────────────────────────────
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<ISystemConfigRepository, SystemConfigRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<ITrustScoreRepository, TrustScoreRepository>();
        services.AddScoped<IRiskScoringService, RiskScoringService>();
        services.AddScoped<IPricingSuggestionService, PricingSuggestionService>();

        return services;
    }
}
