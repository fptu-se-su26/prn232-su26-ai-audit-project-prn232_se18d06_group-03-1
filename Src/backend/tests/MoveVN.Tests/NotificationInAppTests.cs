using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Validators;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Tests;

public class NotificationInAppTests
{
    [Theory]
    [InlineData("InApp")]
    [InlineData("Email")]
    [InlineData("Both")]
    public void CreateNotificationValidator_AcceptsSupportedChannels(string channel)
    {
        var result = new CreateNotificationRequestValidator().Validate(ValidRequest(channel));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateNotificationValidator_RejectsUnsupportedChannel()
    {
        var result = new CreateNotificationRequestValidator().Validate(ValidRequest("Push"));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == nameof(CreateNotificationRequest.Channel));
    }

    [Fact]
    public void NotificationModel_HasUniqueFilteredDeduplicationIndex()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"notification-model-{Guid.NewGuid()}")
            .Options;
        using var context = new AppDbContext(options);

        var index = context.Model.FindEntityType(typeof(Notification))!
            .GetIndexes()
            .Single(candidate => candidate.Properties.Select(property => property.Name)
                .SequenceEqual([nameof(Notification.UserId), nameof(Notification.DeduplicationKey)]));

        index.IsUnique.Should().BeTrue();
    }

    private static CreateNotificationRequest ValidRequest(string channel)
        => new()
        {
            UserId = 1,
            Type = "Booking",
            Title = "Booking updated",
            Body = "Your booking status changed.",
            Channel = channel,
            DeduplicationKey = "booking:1:approved:1"
        };
}
