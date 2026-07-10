using AutoMapper;
using FluentValidation;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Admin.Services;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Auth.Services;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Bookings.Services;
using MoveVN.Application.Modules.DriverLicenseClasses.Interfaces;
using MoveVN.Application.Modules.DriverLicenseClasses.Services;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Services;
using MoveVN.Application.Modules.Reviews.Interfaces;
using MoveVN.Application.Modules.Reviews.Services;
using MoveVN.Application.Modules.Owner.Interfaces;
using MoveVN.Application.Modules.Owner.Services;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Notifications.Services;
using MoveVN.Application.Modules.Areas.Interfaces;
using MoveVN.Application.Modules.Areas.Services;
using MoveVN.Application.Modules.PricingRegions.Interfaces;
using MoveVN.Application.Modules.PricingRegions.Services;
using MoveVN.Application.Modules.PricingRules.Interfaces;
using MoveVN.Application.Modules.PricingRules.Services;
using MoveVN.Application.Modules.PlatformFeeRules.Interfaces;
using MoveVN.Application.Modules.PlatformFeeRules.Services;
using MoveVN.Application.Modules.SupportTickets.Interfaces;
using MoveVN.Application.Modules.SupportTickets.Services;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Application.Modules.Users.Services;
using MoveVN.Application.Modules.VehicleBrands.Interfaces;
using MoveVN.Application.Modules.VehicleBrands.Services;
using MoveVN.Application.Modules.VehicleFeatures.Interfaces;
using MoveVN.Application.Modules.VehicleFeatures.Services;
using MoveVN.Application.Modules.VehicleModels.Interfaces;
using MoveVN.Application.Modules.VehicleModels.Services;
using MoveVN.Application.Modules.VehicleModelPricings.Interfaces;
using MoveVN.Application.Modules.VehicleModelPricings.Services;
using MoveVN.Application.Modules.VehicleModelVariants.Interfaces;
using MoveVN.Application.Modules.VehicleModelVariants.Services;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.Services;
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
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IOwnerApplicationService, OwnerApplicationService>();
        services.AddScoped<IStaffOwnerApplicationService, StaffOwnerApplicationService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IVehicleBrandService, VehicleBrandService>();
        services.AddScoped<IVehicleModelService, VehicleModelService>();
        services.AddScoped<IVehicleModelVariantService, VehicleModelVariantService>();
        services.AddScoped<IDriverLicenseClassService, DriverLicenseClassService>();
        services.AddScoped<IDriverLicenseService, DriverLicenseService>();
        services.AddScoped<IVehicleFeatureService, VehicleFeatureService>();
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<IPublicVehicleService, PublicVehicleService>();
        services.AddScoped<IVehicleModerationService, VehicleModerationService>();
        services.AddScoped<IVehicleCatalogService, VehicleCatalogService>();
        services.AddScoped<IPricingRegionService, PricingRegionService>();
        services.AddScoped<IAreaService, AreaService>();
        services.AddScoped<IVehicleModelPricingService, VehicleModelPricingService>();
        services.AddScoped<IPricingRuleService, PricingRuleService>();
        services.AddScoped<IPricingCalculatorService, PricingCalculatorService>();
        services.AddScoped<IPlatformFeeRuleService, PlatformFeeRuleService>();
        services.AddScoped<IVehiclePricingService, VehiclePricingService>();
        services.AddScoped<IBookingRiskScorer, RuleBasedBookingRiskScorer>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IBlockedDateService, BlockedDateService>();
        services.AddScoped<ISupportTicketService, SupportTicketService>();
        services.AddScoped<IReviewService, ReviewService>();

        return services;
    }
}
