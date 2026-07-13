using MoveVN.Application.Interfaces;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.SupportTickets.Interfaces;
using MoveVN.Infrastructure.Identity;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Mongo;
using MoveVN.Infrastructure.Persistence.Mongo.Migrations;
using MoveVN.Infrastructure.Persistence.Repositories;
using MoveVN.Infrastructure.Persistence.Repositories.Bookings;
using MoveVN.Infrastructure.Persistence.Repositories.SupportTickets;
using MoveVN.Infrastructure.Services;
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
                npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

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
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IDriverLicenseVerificationRepository, DriverLicenseVerificationRepository>();
        services.AddScoped<ICustomerDriverLicenseRepository, CustomerDriverLicenseRepository>();
        services.AddScoped<IVehicleCatalogRepository, VehicleCatalogRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IOtpCodeRepository, OtpCodeRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordHasherService, PasswordHasherService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IAuthActivityLogger, AuthActivityLogger>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddHttpClient("UpstashRedis", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(3);
        });
        services.AddSingleton<ITokenSessionService, RedisTokenSessionService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<DbInitializer>();

        services.AddSingleton<ICloudinaryService, CloudinaryService>();
        services.AddSingleton<IRedisLockService, RedisLockService>();
        services.AddSingleton<IDriverLicenseUploadAttemptLimiter, RedisDriverLicenseUploadAttemptLimiter>();
        services.AddSingleton<IVehicleDocumentUploadAttemptLimiter, RedisVehicleDocumentUploadAttemptLimiter>();
        services.AddScoped<IFptAiService, FptAiService>();
        services.AddScoped<IPresenceService, RedisPresenceService>();
        services.AddScoped<IVehicleRegistrationVerificationService, VehicleRegistrationVerificationService>();
        services.AddScoped<IDriverLicenseVerificationClient, DriverLicenseVerificationClient>();
        services.AddScoped<INationalIdVerificationClient, NationalIdVerificationClient>();
        services.AddScoped<IVehicleVerificationLogQueryService, VehicleVerificationLogQueryService>();
        services.AddScoped<IVehicleVerificationLogService, VehicleVerificationLogService>();
        services.AddScoped<IDriverLicenseVerificationLogService, DriverLicenseVerificationLogService>();
        services.AddScoped<INationalIdVerificationLogService, NationalIdVerificationLogService>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<ISupportTicketRepository, SupportTicketRepository>();

        var mongoConnection = configuration["MONGO_CONNECTION"];
        if (!string.IsNullOrWhiteSpace(mongoConnection))
        {
            services.Configure<MongoDbSettings>(settings =>
            {
                settings.ConnectionString = mongoConnection;
                settings.DatabaseName = configuration["MONGO_DATABASE"] ?? "movevn";
            });

            services.AddSingleton<MongoDbContext>();
            services.AddSingleton<MongoIndexInitializer>();
            services.AddSingleton<MongoMigrationRunner>();

            foreach (var migrationType in typeof(IMongoMigration).Assembly.GetTypes()
                .Where(type => typeof(IMongoMigration).IsAssignableFrom(type)
                    && type is { IsAbstract: false, IsInterface: false }))
            {
                services.AddSingleton(typeof(IMongoMigration), migrationType);
            }
        }

        return services;
    }
}
