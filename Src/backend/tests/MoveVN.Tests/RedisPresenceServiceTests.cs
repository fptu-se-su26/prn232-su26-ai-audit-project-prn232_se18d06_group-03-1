using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Services;

namespace MoveVN.Tests;

public class RedisPresenceServiceTests
{
    [Fact]
    public async Task GetOnlineStatusesAsync_WhenRedisIsNotConfigured_FallsBackToDatabase()
    {
        await using var context = CreateContext();
        context.Users.AddRange(
            CreateUser(1, isOnline: true, lastSeenAt: null),
            CreateUser(2, isOnline: false, lastSeenAt: DateTime.UtcNow.AddMinutes(-5)));
        await context.SaveChangesAsync();
        var service = CreateService(context);

        var result = await service.GetOnlineStatusesAsync([1, 2, 999]);

        result.Should().BeEquivalentTo(new Dictionary<long, bool>
        {
            [1] = true,
            [2] = false,
            [999] = false
        });
    }

    [Fact]
    public async Task GetOnlineStatusAsync_WhenRedisIsNotConfigured_ReturnsLastSeenFromDatabase()
    {
        await using var context = CreateContext();
        var lastSeenAt = DateTime.UtcNow.AddMinutes(-3);
        context.Users.Add(CreateUser(10, isOnline: false, lastSeenAt));
        await context.SaveChangesAsync();
        var service = CreateService(context);

        var result = await service.GetOnlineStatusAsync(10);

        result.Should().NotBeNull();
        result!.IsOnline.Should().BeFalse();
        result.LastSeenAt.Should().BeCloseTo(lastSeenAt, TimeSpan.FromMilliseconds(1));
    }

    private static RedisPresenceService CreateService(AppDbContext context)
    {
        var configuration = new ConfigurationBuilder().Build();
        return new RedisPresenceService(
            configuration,
            new UnusedHttpClientFactory(),
            context,
            NullLogger<RedisPresenceService>.Instance);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"presence-tests-{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    private static User CreateUser(long id, bool isOnline, DateTime? lastSeenAt)
    {
        return new User
        {
            Id = id,
            Email = $"user{id}@example.com",
            FullName = $"User {id}",
            Status = "Active",
            IsOnline = isOnline,
            LastSeenAt = lastSeenAt
        };
    }

    private sealed class UnusedHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) =>
            throw new InvalidOperationException("HTTP should not be called when Redis is not configured.");
    }
}
