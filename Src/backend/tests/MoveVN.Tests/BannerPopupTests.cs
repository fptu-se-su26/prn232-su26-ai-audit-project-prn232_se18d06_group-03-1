using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Banners.DTOs;
using MoveVN.Application.Modules.Banners.Services;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Repositories;

namespace MoveVN.Tests;

public class BannerPopupTests
{
    private sealed class FakeCloudinaryService : ICloudinaryService
    {
        public Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
            => Task.FromResult(new CloudinaryUploadResult("fake-id", "https://example.com/fake.jpg", 800, 450, 1234));

        public Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
            => Task.FromResult(new CloudinaryUploadResult(publicId, "https://example.com/fake.jpg", 800, 450, 1234));

        public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60)
            => Task.FromResult("https://example.com/signed.jpg");

        public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private static BannerService CreateService(AppDbContext context)
        => new(new BannerRepository(context), new PromotionRepository(context), new FakeCloudinaryService());

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static CreateBannerRequest PopupRequest()
        => new()
        {
            Title = "FPT Student Deal",
            ImageUrl = "https://example.com/banner.jpg",
            PopupTitle = "FPT Student Deal - Giảm 50%",
            PopupDescription = "Line 1\nLine 2\nLine 3",
            PopupCtaLabel = "Nhận voucher",
            DisplayOrder = 0,
            IsActive = true,
        };

    [Fact]
    public async Task Create_PopupWithoutTargetUrl_Accepted()
    {
        // Popup-only model: there is no TargetUrl on the DTO at all.
        await using var context = CreateContext();
        var service = CreateService(context);

        // The popup-only contract removed these properties entirely (compile-time guarantee).
        typeof(CreateBannerRequest).GetProperty("TargetUrl").Should().BeNull();
        typeof(CreateBannerRequest).GetProperty("ClickAction").Should().BeNull();
        typeof(CreateBannerRequest).GetProperty("PopupCtaUrl").Should().BeNull();
        typeof(UpdateBannerRequest).GetProperty("ClearTargetUrl").Should().BeNull();
        var request = PopupRequest();

        var result = await service.CreateAsync(request, createdBy: 1);

        result.PopupTitle.Should().Be("FPT Student Deal - Giảm 50%");
    }

    [Fact]
    public async Task Create_PopupPreservesMultilineDescription()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreateAsync(PopupRequest(), createdBy: 1);

        result.PopupDescription.Should().Be("Line 1\nLine 2\nLine 3");
    }

    [Fact]
    public async Task Create_PopupWithApprovedPromotion_MapsPromotionInfo()
    {
        await using var context = CreateContext();
        context.Promotions.Add(new Promotion
        {
            Id = 1,
            Code = "DEAL50",
            Name = "Deal 50",
            DiscountType = "Percentage",
            DiscountValue = 50,
            VehicleType = "All",
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(5),
            MaxUsageCount = 100,
            IsActive = true,
            ApprovalStatus = "Approved",
            CreatedByRole = "Admin",
        });
        await context.SaveChangesAsync();
        var service = CreateService(context);
        var request = PopupRequest();
        request.PromotionId = 1;

        var result = await service.CreateAsync(request, createdBy: 1);

        result.PromotionCode.Should().Be("DEAL50");
        result.PromotionName.Should().Be("Deal 50");
    }

    [Fact]
    public async Task Homepage_ContainsPopupAndPromotionFields_WithoutNavigationFields()
    {
        await using var context = CreateContext();
        context.Promotions.Add(new Promotion
        {
            Id = 1,
            Code = "DEAL50",
            Name = "Deal 50",
            DiscountType = "Percentage",
            DiscountValue = 50,
            VehicleType = "All",
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(5),
            MaxUsageCount = 100,
            IsActive = true,
            ApprovalStatus = "Approved",
            CreatedByRole = "Admin",
        });
        await context.SaveChangesAsync();
        var service = CreateService(context);
        var request = PopupRequest();
        request.PromotionId = 1;
        await service.CreateAsync(request, createdBy: 1);

        var result = await service.GetHomepageAsync();

        result.Should().ContainSingle();
        var item = result[0];
        item.PopupTitle.Should().Be("FPT Student Deal - Giảm 50%");
        item.PopupDescription.Should().Be("Line 1\nLine 2\nLine 3");
        item.PopupCtaLabel.Should().Be("Nhận voucher");
        item.PromotionCode.Should().Be("DEAL50");
        item.PromotionName.Should().Be("Deal 50");
        item.DiscountType.Should().Be("Percentage");
        item.DiscountValue.Should().Be(50);
        item.VehicleType.Should().Be("All");
        item.EndAt.Should().NotBeNull();
        typeof(HomepageBannerItem).GetProperty("ClickAction").Should().BeNull();
        typeof(HomepageBannerItem).GetProperty("TargetUrl").Should().BeNull();
        typeof(HomepageBannerItem).GetProperty("PopupCtaUrl").Should().BeNull();
    }

    [Fact]
    public async Task Homepage_LegacyRowWithoutPopupContent_IsExcludedByVisibility()
    {
        // Simulates a legacy row that the defensive deactivation would hide:
        // empty popup content can never satisfy the required-field guards.
        await using var context = CreateContext();
        var service = CreateService(context);

        var act = () => service.CreateAsync(new CreateBannerRequest
        {
            Title = "Legacy",
            ImageUrl = "https://example.com/x.jpg",
            PopupTitle = string.Empty,
            PopupDescription = "Has description",
            PopupCtaLabel = "Nhận voucher",
            DisplayOrder = 0,
        }, createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(ErrorCode.BANNER_POPUP_TITLE_REQUIRED);
    }
}
