using AutoMapper;
using FluentValidation;
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

        return services;
    }
}
