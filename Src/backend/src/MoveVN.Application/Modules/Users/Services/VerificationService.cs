using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Users.Services;

public class VerificationService : IVerificationService
{
    private readonly IVerificationRepository _repo;
    private readonly ICloudinaryService _cloudinary;
    private readonly IAesEncryptionService _aes;
    private readonly INotificationService _notifications;

    public VerificationService(
        IVerificationRepository repo,
        ICloudinaryService cloudinary,
        IAesEncryptionService aes,
        INotificationService notifications)
    {
        _repo = repo;
        _cloudinary = cloudinary;
        _aes = aes;
        _notifications = notifications;
    }

    public async Task<VerificationDto> SubmitAsync(CreateVerificationRequest request, long userId, CancellationToken cancellationToken = default)
    {
        var frontUrl = await _cloudinary.UploadImageAsync(request.FrontImage, "verifications", cancellationToken);
        string? backUrl = null;
        if (request.BackImage is not null)
            backUrl = await _cloudinary.UploadImageAsync(request.BackImage, "verifications", cancellationToken);

        var verification = new VerificationRequest
        {
            UserId = userId,
            Type = request.Type,
            FrontImageUrl = _aes.Encrypt(frontUrl),
            BackImageUrl = backUrl is null ? null : _aes.Encrypt(backUrl),
            Status = "Pending"
        };

        await _repo.AddAsync(verification, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        return MapToDto(verification, frontUrl, backUrl);
    }

    public async Task<VerificationDto> ReviewAsync(long verificationId, long staffId, ReviewVerificationRequest request, CancellationToken cancellationToken = default)
    {
        var verification = await _repo.GetByIdAsync(verificationId, cancellationToken)
            ?? throw new NotFoundException("Verification not found.");

        if (!request.Approve && string.IsNullOrWhiteSpace(request.Reason))
            throw new ValidationException(new[] { "Reject reason is required." });

        verification.Status = request.Approve ? "Approved" : "Rejected";
        verification.ReviewedBy = staffId;
        verification.ReviewedAt = DateTime.UtcNow;
        verification.RejectionReason = request.Approve ? null : request.Reason;

        _repo.Update(verification);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = verification.UserId,
            Type = request.Approve ? "VerificationApproved" : "VerificationRejected",
            Title = request.Approve ? "Verification approved" : "Verification rejected",
            Body = request.Approve
                ? "Your verification request has been approved."
                : $"Your verification request was rejected. Reason: {request.Reason}"
        }));

        var frontUrl = _aes.Decrypt(verification.FrontImageUrl);
        var backUrl = verification.BackImageUrl is null ? null : _aes.Decrypt(verification.BackImageUrl);
        return MapToDto(verification, frontUrl, backUrl);
    }

    public async Task<PagedResult<VerificationDto>> GetPendingQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var paged = await _repo.GetPendingPagedAsync(page, pageSize, cancellationToken);
        var items = paged.Items.Select(v => new VerificationDto
        {
            Id = v.Id,
            UserId = v.UserId,
            Type = v.Type,
            FrontImageUrl = _aes.Decrypt(v.FrontImageUrl),
            BackImageUrl = v.BackImageUrl is null ? null : _aes.Decrypt(v.BackImageUrl),
            Status = v.Status,
            RejectionReason = v.RejectionReason,
            CreatedAt = v.CreatedAt
        }).ToList();

        return PagedResult<VerificationDto>.Create(items, paged.TotalCount, paged.Page, paged.PageSize);
    }

    public async Task<List<VerificationDto>> GetByUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        var records = await _repo.GetByUserAsync(userId, cancellationToken);
        return records.Select(v =>
        {
            var frontUrl = _aes.Decrypt(v.FrontImageUrl);
            var backUrl = v.BackImageUrl is null ? null : _aes.Decrypt(v.BackImageUrl);
            return MapToDto(v, frontUrl, backUrl);
        }).ToList();
    }

    private static VerificationDto MapToDto(VerificationRequest v, string frontUrl, string? backUrl) => new()
    {
        Id = v.Id,
        UserId = v.UserId,
        Type = v.Type,
        FrontImageUrl = frontUrl,
        BackImageUrl = backUrl,
        Status = v.Status,
        RejectionReason = v.RejectionReason,
        CreatedAt = v.CreatedAt
    };
}
