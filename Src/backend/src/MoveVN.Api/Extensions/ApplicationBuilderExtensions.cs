using MoveVN.Api.Middleware;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Mongo;
using MoveVN.Infrastructure.Persistence.Mongo.Migrations;
using Microsoft.EntityFrameworkCore;

namespace MoveVN.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }

    public static async Task<WebApplication> ApplyDatabaseMigrationsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var dbInitializer = scope.ServiceProvider.GetRequiredService<DbInitializer>();
        await dbInitializer.SeedAsync();

        var mongoMigrationRunner = scope.ServiceProvider.GetService<MongoMigrationRunner>();
        if (mongoMigrationRunner is not null)
        {
            await mongoMigrationRunner.RunAsync();
        }

        var mongoIndexInitializer = scope.ServiceProvider.GetService<MongoIndexInitializer>();
        if (mongoIndexInitializer is not null)
        {
            await mongoIndexInitializer.CreateIndexesAsync();
        }

        return app;
    }
}
