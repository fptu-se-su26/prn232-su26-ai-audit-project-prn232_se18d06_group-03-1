using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Banners.DTOs;
using MoveVN.Application.Modules.Banners.Services;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Repositories;

namespace MoveVN.Tests;

public class BannerServiceTests
{
    private sealed class FakeCloudinaryService : ICloudinaryService
    {
        public List<string> DeletedPublicIds { get; } = [];

        public Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
            => Task.FromResult(new CloudinaryUploadResult("fake-id", "https://example.com/fake.jpg", 800, 450, 1234));

        public Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
            => Task.FromResult(new CloudinaryUploadResult(publicId, "https://example.com/fake.jpg", 800, 450, 1234));

        public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60)
            => Task.FromResult("https://example.com/signed.jpg");

        public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
        {
            DeletedPublicIds.Add(publicId);
            return Task.CompletedTask;
        }
    }

    private static (BannerService Service, FakeCloudinaryService Cloudinary) CreateService(AppDbContext context)
    {
        var bannerRepo = new BannerRepository(context);
        var promoRepo = new PromotionRepository(context);
        var cloudinary = new FakeCloudinaryService();
        return (new BannerService(bannerRepo, promoRepo, cloudinary), cloudinary);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Promotion CreatePromotion(long id, string approvalStatus)
        => new()
        {
            Id = id,
            Code = $"PROMO{id}",
            Name = $"Promo {id}",
            DiscountType = "Fixed",
            DiscountValue = 10000,
            StartAt = DateTime.UtcNow.AddDays(-1),
            MaxUsageCount = 100,
            IsActive = true,
            ApprovalStatus = approvalStatus,
            CreatedByRole = "Owner",
            OwnerId = 7,
        };

    private static CreateBannerRequest CreateRequest(long? promotionId = null)
        => new()
        {
            Title = "Summer Ride",
            ImageUrl = "https://example.com/banner.jpg",
            ImagePublicId = "movevn/banners/summer",
            PromotionId = promotionId,
            PopupTitle = "Summer Deal",
            PopupDescription = "Line 1\nLine 2",
            PopupCtaLabel = "Nhận voucher",
            DisplayOrder = 1,
            IsActive = true,
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(10),
        };

    private static Banner CreateEntity(string title, int displayOrder, bool isActive,
        DateTime? startAt = null, DateTime? endAt = null, long createdBy = 0)
        => new()
        {
            Title = title,
            ImageUrl = "https://example.com/1.jpg",
            PopupTitle = $"{title} popup",
            PopupDescription = $"{title} description",
            PopupCtaLabel = "Nhận voucher",
            DisplayOrder = displayOrder,
            IsActive = isActive,
            StartAt = startAt,
            EndAt = endAt,
            CreatedBy = createdBy,
        };

    [Fact]
    public async Task Create_WithoutPromotion_Succeeds()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);

        var result = await service.CreateAsync(CreateRequest(), createdBy: 1);

        result.Id.Should().BeGreaterThan(0);
        result.Title.Should().Be("Summer Ride");
        result.PromotionId.Should().BeNull();
        result.PopupTitle.Should().Be("Summer Deal");
        result.PopupDescription.Should().Be("Line 1\nLine 2");
        result.PopupCtaLabel.Should().Be("Nhận voucher");
        result.CreatedBy.Should().Be(1);
    }

    [Fact]
    public async Task Create_WithApprovedPromotion_Succeeds()
    {
        await using var context = CreateContext();
        context.Promotions.Add(CreatePromotion(1, "Approved"));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);

        var result = await service.CreateAsync(CreateRequest(promotionId: 1), createdBy: 1);

        result.PromotionId.Should().Be(1);
        result.PromotionCode.Should().Be("PROMO1");
    }

    [Fact]
    public async Task Create_WithNonExistingPromotion_ThrowsNotFound()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);

        var act = () => service.CreateAsync(CreateRequest(promotionId: 999), createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_PROMOTION_NOT_FOUND);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Rejected")]
    public async Task Create_WithNonApprovedPromotion_Rejects(string approvalStatus)
    {
        await using var context = CreateContext();
        context.Promotions.Add(CreatePromotion(1, approvalStatus));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);

        var act = () => service.CreateAsync(CreateRequest(promotionId: 1), createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_PROMOTION_NOT_APPROVED);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_MissingPopupTitle_Rejects(string? popupTitle)
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var request = CreateRequest();
        request.PopupTitle = popupTitle!;

        var act = () => service.CreateAsync(request, createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_POPUP_TITLE_REQUIRED);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_MissingPopupDescription_Rejects(string? popupDescription)
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var request = CreateRequest();
        request.PopupDescription = popupDescription!;

        var act = () => service.CreateAsync(request, createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_POPUP_DESCRIPTION_REQUIRED);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_MissingPopupCtaLabel_Rejects(string? popupCtaLabel)
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var request = CreateRequest();
        request.PopupCtaLabel = popupCtaLabel!;

        var act = () => service.CreateAsync(request, createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_POPUP_CTA_LABEL_REQUIRED);
    }

    [Fact]
    public async Task Create_WithInvalidDateRange_Rejects()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var request = CreateRequest();
        request.StartAt = DateTime.UtcNow.AddDays(10);
        request.EndAt = DateTime.UtcNow.AddDays(1);

        var act = () => service.CreateAsync(request, createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_DATE_RANGE_INVALID);
    }

    [Fact]
    public async Task Create_WithNegativeDisplayOrder_Rejects()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var request = CreateRequest();
        request.DisplayOrder = -1;

        var act = () => service.CreateAsync(request, createdBy: 1);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_DISPLAY_ORDER_INVALID);
    }

    [Fact]
    public async Task Homepage_ExcludesInactiveFutureAndExpired()
    {
        await using var context = CreateContext();
        var now = DateTime.UtcNow;
        context.Banners.AddRange(
            CreateEntity("Visible", 1, true),
            CreateEntity("Inactive", 0, false),
            CreateEntity("Future", 0, true, startAt: now.AddDays(1)),
            CreateEntity("Expired", 0, true, endAt: now.AddDays(-1)));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);

        var result = await service.GetHomepageAsync();

        result.Should().ContainSingle();
        result[0].Title.Should().Be("Visible");
    }

    [Fact]
    public async Task Homepage_SortsByDisplayOrderThenCreatedAtDesc()
    {
        await using var context = CreateContext();
        var now = DateTime.UtcNow;
        var second = CreateEntity("Second", 2, true);
        second.CreatedAt = now.AddHours(-3);
        var first = CreateEntity("First", 1, true);
        first.CreatedAt = now.AddHours(-2);
        var newest = CreateEntity("Newest-Same-Order", 1, true);
        newest.CreatedAt = now.AddHours(-1);
        context.Banners.AddRange(second, first, newest);
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);

        var result = await service.GetHomepageAsync();

        result.Select(x => x.Title).Should().ContainInOrder("Newest-Same-Order", "First", "Second");
    }

    [Fact]
    public async Task Homepage_DoesNotExposeCreatedBy()
    {
        await using var context = CreateContext();
        context.Banners.Add(CreateEntity("Visible", 0, true, createdBy: 42));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);

        var result = await service.GetHomepageAsync();

        result.Should().ContainSingle();
        typeof(HomepageBannerItem).GetProperty("CreatedBy").Should().BeNull();
    }

    [Fact]
    public async Task Homepage_ContainsPopupData()
    {
        await using var context = CreateContext();
        context.Banners.Add(CreateEntity("Visible", 0, true));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);

        var result = await service.GetHomepageAsync();

        result.Should().ContainSingle();
        result[0].PopupTitle.Should().Be("Visible popup");
        result[0].PopupDescription.Should().Be("Visible description");
        result[0].PopupCtaLabel.Should().Be("Nhận voucher");
    }

    [Fact]
    public async Task Toggle_FlipsIsActive()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var created = await service.CreateAsync(CreateRequest(), createdBy: 1);

        var turnedOff = await service.ToggleActiveAsync(created.Id);
        var turnedOn = await service.ToggleActiveAsync(created.Id);

        turnedOff.Should().BeFalse();
        turnedOn.Should().BeTrue();
    }

    [Fact]
    public async Task Update_AppliesPartialChanges()
    {
        await using var context = CreateContext();
        context.Promotions.Add(CreatePromotion(1, "Approved"));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);
        var created = await service.CreateAsync(CreateRequest(promotionId: 1), createdBy: 1);

        var updated = await service.UpdateAsync(created.Id, new UpdateBannerRequest
        {
            Title = "Renamed",
            PopupTitle = "New popup",
            PopupCtaLabel = "Săn voucher ngay",
            DisplayOrder = 5,
            ClearPromotion = true,
            ClearStartAt = true,
            ClearEndAt = true,
        });

        updated.Title.Should().Be("Renamed");
        updated.PopupTitle.Should().Be("New popup");
        updated.PopupCtaLabel.Should().Be("Săn voucher ngay");
        updated.DisplayOrder.Should().Be(5);
        updated.PromotionId.Should().BeNull();
        updated.StartAt.Should().BeNull();
        updated.EndAt.Should().BeNull();
    }

    [Fact]
    public async Task Update_WithBlankPopupTitle_Rejects()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);
        var created = await service.CreateAsync(CreateRequest(), createdBy: 1);

        var act = () => service.UpdateAsync(created.Id, new UpdateBannerRequest { PopupTitle = "  " });

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_POPUP_TITLE_REQUIRED);
    }

    [Fact]
    public async Task Update_WithNonApprovedPromotion_Rejects()
    {
        await using var context = CreateContext();
        context.Promotions.Add(CreatePromotion(1, "Pending"));
        await context.SaveChangesAsync();
        var (service, _) = CreateService(context);
        var created = await service.CreateAsync(CreateRequest(), createdBy: 1);

        var act = () => service.UpdateAsync(created.Id, new UpdateBannerRequest { PromotionId = 1 });

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_PROMOTION_NOT_APPROVED);
    }

    [Fact]
    public async Task Update_ReplacingImage_DeletesOldCloudinaryAsset()
    {
        await using var context = CreateContext();
        var (service, cloudinary) = CreateService(context);
        var created = await service.CreateAsync(CreateRequest(), createdBy: 1);

        var updated = await service.UpdateAsync(created.Id, new UpdateBannerRequest
        {
            ImageUrl = "https://example.com/new.jpg",
            ImagePublicId = "movevn/banners/new",
        });

        updated.ImageUrl.Should().Be("https://example.com/new.jpg");
        cloudinary.DeletedPublicIds.Should().ContainSingle().Which.Should().Be("movevn/banners/summer");
    }

    [Fact]
    public async Task Delete_RemovesBannerAndCleansCloudinaryAsset()
    {
        await using var context = CreateContext();
        var (service, cloudinary) = CreateService(context);
        var created = await service.CreateAsync(CreateRequest(), createdBy: 1);

        var result = await service.DeleteAsync(created.Id);

        result.Should().BeTrue();
        (await service.GetByIdAsync(created.Id)).Should().BeNull();
        cloudinary.DeletedPublicIds.Should().ContainSingle().Which.Should().Be("movevn/banners/summer");
    }

    [Fact]
    public async Task Delete_MissingBanner_ThrowsNotFound()
    {
        await using var context = CreateContext();
        var (service, _) = CreateService(context);

        var act = () => service.DeleteAsync(999);

        (await act.Should().ThrowAsync<AppException>())
            .Which.ErrorCode.Should().Be(MoveVN.Application.Common.Errors.ErrorCode.BANNER_NOT_FOUND);
    }

    [Theory]
    [InlineData(true, null, null, true)]
    [InlineData(false, null, null, false)]
    public void BannerRules_Visibility(bool isActive, DateTime? startAt, DateTime? endAt, bool expected)
    {
        var now = DateTime.UtcNow;
        BannerRules.IsVisible(isActive, startAt, endAt, now).Should().Be(expected);
    }

    [Fact]
    public void BannerRules_VisibilityRespectsSchedule()
    {
        var now = DateTime.UtcNow;
        BannerRules.IsVisible(true, now.AddDays(1), null, now).Should().BeFalse();
        BannerRules.IsVisible(true, null, now.AddDays(-1), now).Should().BeFalse();
        BannerRules.IsVisible(true, now.AddDays(-1), now.AddDays(1), now).Should().BeTrue();
    }
}
