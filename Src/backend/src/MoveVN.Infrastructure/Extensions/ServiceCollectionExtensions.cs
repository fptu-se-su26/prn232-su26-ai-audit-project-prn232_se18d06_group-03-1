using MoveVN.Application.Interfaces;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Infrastructure.Identity;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Mongo;
using MoveVN.Infrastructure.Persistence.Mongo.Migrations;
using MoveVN.Infrastructure.Persistence.Repositories;
using MoveVN.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

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
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IOtpCodeRepository, OtpCodeRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordHasherService, PasswordHasherService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IAuthActivityLogger, AuthActivityLogger>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<ITokenSessionService, RedisTokenSessionService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<DbInitializer>();

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
