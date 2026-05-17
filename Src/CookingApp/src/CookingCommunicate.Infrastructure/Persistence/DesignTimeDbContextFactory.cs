using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace CookingCommunicate.Infrastructure.Persistence;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var solutionRoot = Path.GetFullPath(Path.Combine(currentDirectory, "..", ".."));
        var envPath = Path.Combine(solutionRoot, ".env");

        if (File.Exists(envPath))
        {
            Env.Load(envPath);
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(solutionRoot, "src", "CookingCommunicate.Api"))
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DB_CONNECTION environment variable is not configured.");

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sqlOptions =>
            sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));

        return new AppDbContext(optionsBuilder.Options);
    }
}
