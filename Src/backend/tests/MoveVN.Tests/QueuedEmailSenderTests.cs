using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Services;

namespace MoveVN.Tests;

public class QueuedEmailSenderTests
{
    [Fact]
    public async Task SendNotificationAsync_PersistsPendingEmailWithoutCallingSmtp()
    {
        await using var provider = CreateProvider();
        using (var scope = provider.CreateScope())
        {
            var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            await sender.SendNotificationAsync(
                "customer@example.com",
                "Customer",
                "Booking approved",
                "Please pay the deposit.");
        }

        using var verificationScope = provider.CreateScope();
        var dbContext = verificationScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailLog = await dbContext.EmailLogs.SingleAsync();

        emailLog.EmailType.Should().Be("Notification");
        emailLog.RecipientEmail.Should().Be("customer@example.com");
        emailLog.Status.Should().Be("Pending");
        emailLog.AttemptCount.Should().Be(0);
        emailLog.MaxAttempts.Should().Be(3);
        emailLog.PayloadJson.Should().Contain("Booking approved");
    }

    [Fact]
    public async Task SendOtpAsync_QueuesOtpForBackgroundDelivery()
    {
        await using var provider = CreateProvider();
        using (var scope = provider.CreateScope())
        {
            var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            await sender.SendOtpAsync("user@example.com", "123456", "Register");
        }

        using var verificationScope = provider.CreateScope();
        var dbContext = verificationScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailLog = await dbContext.EmailLogs.SingleAsync();

        emailLog.EmailType.Should().Be("Otp");
        emailLog.Subject.Should().Be("MoveVN OTP - Register");
        emailLog.PayloadJson.Should().Contain("123456");
        emailLog.Status.Should().Be("Pending");
    }

    private static ServiceProvider CreateProvider()
    {
        var databaseName = $"email-queue-tests-{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(databaseName));
        services.AddScoped<IEmailSender, QueuedEmailSender>();
        return services.BuildServiceProvider();
    }
}
