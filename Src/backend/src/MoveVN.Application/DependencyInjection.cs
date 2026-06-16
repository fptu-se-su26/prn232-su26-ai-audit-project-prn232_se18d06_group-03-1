using AutoMapper;
using FluentValidation;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Auth.Services;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Bookings.Services;
using MoveVN.Application.Modules.Contracts.Interfaces;
using MoveVN.Application.Modules.Contracts.Services;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Notifications.Services;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Payments.Services;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Application.Modules.Reports.Services;
using MoveVN.Application.Modules.Reviews.Interfaces;
using MoveVN.Application.Modules.Reviews.Services;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Application.Modules.System.Services;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Application.Modules.Users.Services;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Application.Modules.Vehicles.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using System.Reflection;

namespace MoveVN.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var mapperConfig = new MapperConfiguration(config =>
        {
            config.AddMaps(Assembly.GetExecutingAssembly());
        }, NullLoggerFactory.Instance);

        services.AddSingleton(mapperConfig.CreateMapper());
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Auth
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAuthLogService, AuthLogService>();

        // Users
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IVerificationService, VerificationService>();
        services.AddScoped<IAdminUserService, AdminUserService>();

        // Vehicles
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<IBlockedDateService, BlockedDateService>();

        // Bookings
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IInspectionService, InspectionService>();

        // Payments & Contracts
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IContractService, ContractService>();

        // Reviews & Reports
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IDisputeService, DisputeService>();
        services.AddScoped<ISupportTicketService, SupportTicketService>();

        // Notifications
        services.AddScoped<INotificationService, NotificationService>();

        // System
        services.AddScoped<ISystemConfigService, SystemConfigService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ITrustScoreService, TrustScoreService>();

        return services;
    }
}
