using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class DriverLicenseVerificationRepository : IDriverLicenseVerificationRepository
{
    private readonly AppDbContext _context;
    private readonly IEncryptionService _encryption;

    public DriverLicenseVerificationRepository(AppDbContext context, IEncryptionService encryption)
    {
        _context = context;
        _encryption = encryption;
    }

    public Task<VerificationRequest?> GetLatestByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests
            .Where(x => x.UserId == userId && x.Type == "DriverLicense")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<VerificationRequest?> GetLatestVerifiedByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests
            .Where(x => x.UserId == userId && x.Type == "DriverLicense" && x.Status == "Verified")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<VerificationRequest?> GetPreviousVerifiedByUserIdAsync(long userId, long currentRequestId, string vehicleType, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests
            .Where(x => x.UserId == userId
                && x.Type == "DriverLicense"
                && x.Status == "Verified"
                && x.RequestedVehicleType == vehicleType
                && x.Id != currentRequestId
                && x.DeletedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<VerificationRequest?> GetPendingByUserIdAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests
            .Where(x => x.UserId == userId
                && x.Type == "DriverLicense"
                && x.RequestedVehicleType == vehicleType
                && (x.Status == "Pending" || x.Status == "Processing"))
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<VerificationRequest?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests
            .FirstOrDefaultAsync(x => x.Id == id && x.Type == "DriverLicense", cancellationToken);
    }

    public async Task AddAsync(VerificationRequest request, CancellationToken cancellationToken = default)
    {
        await _context.VerificationRequests.AddAsync(request, cancellationToken);
    }

    public void Update(VerificationRequest request)
    {
        _context.VerificationRequests.Update(request);
    }

    public async Task<PagedResult<DriverLicenseVerificationListItem>> GetPagedAsync(
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = from request in _context.VerificationRequests.AsNoTracking()
                    join user in _context.Users.AsNoTracking() on request.UserId equals user.Id
                    where request.Type == "DriverLicense"
                    select new { request, user };

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.request.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLowerInvariant();
            query = query.Where(x => x.user.FullName.ToLower().Contains(kw)
                || x.user.Email.ToLower().Contains(kw));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.request.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.request.Id,
                x.request.UserId,
                x.user.FullName,
                x.user.Email,
                x.request.Status,
                x.request.RequestedVehicleType,
                x.request.Confidence,
                x.request.DecisionReason,
                x.request.ExternalResultJson,
                x.request.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var mapped = items.Select(x =>
        {
            string? licenseClass = null;
            var rawJson = _encryption.Decrypt(x.ExternalResultJson);
            if (!string.IsNullOrWhiteSpace(rawJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(rawJson);
                    if (doc.RootElement.TryGetProperty("extracted", out var extracted)
                        && extracted.TryGetProperty("licenseClass", out var lc))
                    {
                        licenseClass = lc.GetString();
                    }
                }
                catch { }
            }

            return new DriverLicenseVerificationListItem
            {
                Id = x.Id,
                UserId = x.UserId,
                UserFullName = x.FullName,
                UserEmail = x.Email,
                Status = x.Status,
                RequestedVehicleType = x.RequestedVehicleType,
                Confidence = x.Confidence,
                DecisionReason = x.DecisionReason,
                LicenseClass = licenseClass,
                CreatedAt = x.CreatedAt
            };
        }).ToList();

        return new PagedResult<DriverLicenseVerificationListItem>
        {
            Items = mapped,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DriverLicenseVerificationRequestDto?> GetDetailAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await (from request in _context.VerificationRequests.AsNoTracking()
                join user in _context.Users.AsNoTracking() on request.UserId equals user.Id
                where request.Id == id && request.Type == "DriverLicense"
                select new
                {
                    request.Id,
                    request.UserId,
                    user.FullName,
                    user.Email,
                    request.Type,
                    request.Status,
                    request.FrontImageUrl,
                    request.RequestedVehicleType,
                    request.ExternalProvider,
                    request.ExternalResultJson,
                    request.Confidence,
                    request.DecisionReason,
                    request.ProcessedAt,
                    request.ReviewedBy,
                    request.ReviewedAt,
                    request.RejectionReason,
                    request.CreatedAt
                })
            .FirstOrDefaultAsync(cancellationToken);

        if (item is null)
        {
            return null;
        }

        return new DriverLicenseVerificationRequestDto
        {
            Id = item.Id,
            UserId = item.UserId,
            UserFullName = item.FullName,
            UserEmail = item.Email,
            Type = item.Type,
            Status = item.Status,
            FrontImageUrl = item.FrontImageUrl,
            RequestedVehicleType = item.RequestedVehicleType,
            ExternalProvider = item.ExternalProvider,
            ExternalResultJson = _encryption.Decrypt(item.ExternalResultJson),
            Confidence = item.Confidence,
            DecisionReason = item.DecisionReason,
            ProcessedAt = item.ProcessedAt,
            ReviewedBy = item.ReviewedBy,
            ReviewedAt = item.ReviewedAt,
            RejectionReason = item.RejectionReason,
            CreatedAt = item.CreatedAt
        };
    }
}
