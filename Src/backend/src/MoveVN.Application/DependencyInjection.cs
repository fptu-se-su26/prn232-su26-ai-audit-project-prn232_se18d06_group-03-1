using AutoMapper;
using FluentValidation;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Admin.Services;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Auth.Services;
using MoveVN.Application.Modules.DriverLicenseClasses.Interfaces;
using MoveVN.Application.Modules.DriverLicenseClasses.Services;
using MoveVN.Application.Modules.Owner.Interfaces;
using MoveVN.Application.Modules.Owner.Services;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Application.Modules.Users.Services;
using MoveVN.Application.Modules.VehicleBrands.Interfaces;
using MoveVN.Application.Modules.VehicleBrands.Services;
using MoveVN.Application.Modules.VehicleFeatures.Interfaces;
using MoveVN.Application.Modules.VehicleFeatures.Services;
using MoveVN.Application.Modules.VehicleModels.Interfaces;
using MoveVN.Application.Modules.VehicleModels.Services;
using MoveVN.Application.Modules.VehicleModelVariants.Interfaces;
using MoveVN.Application.Modules.VehicleModelVariants.Services;
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
        services.AddScoped<IVehicleBrandService, VehicleBrandService>();
        services.AddScoped<IVehicleModelService, VehicleModelService>();
        services.AddScoped<IVehicleModelVariantService, VehicleModelVariantService>();
        services.AddScoped<IDriverLicenseClassService, DriverLicenseClassService>();
        services.AddScoped<IVehicleFeatureService, VehicleFeatureService>();

        return services;
    }
}
