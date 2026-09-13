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

        var mongoMigrationRunner = default(MongoMigrationRunner);
        try
        {
            mongoMigrationRunner = scope.ServiceProvider.GetService<MongoMigrationRunner>();
            if (mongoMigrationRunner is not null)
            {
                await mongoMigrationRunner.RunAsync();
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Skipped MongoDB migration: MongoDB is unavailable.");
        }

        var mongoIndexInitializer = default(MongoIndexInitializer);
        try
        {
            mongoIndexInitializer = scope.ServiceProvider.GetService<MongoIndexInitializer>();
            if (mongoIndexInitializer is not null)
            {
                await mongoIndexInitializer.CreateIndexesAsync();
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Skipped MongoDB index creation: MongoDB is unavailable.");
        }

        return app;
    }
}
