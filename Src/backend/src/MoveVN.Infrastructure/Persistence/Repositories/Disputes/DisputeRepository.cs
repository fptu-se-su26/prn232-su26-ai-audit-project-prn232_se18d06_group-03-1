using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Disputes.DTOs;
using MoveVN.Application.Modules.Disputes.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Infrastructure.Persistence.Repositories.Disputes;

public class DisputeRepository : IDisputeRepository
{
    private readonly AppDbContext _context;

    public DisputeRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Booking?> GetBookingByIdAsync(long bookingId, CancellationToken cancellationToken = default)
        => _context.Bookings.FirstOrDefaultAsync(booking => booking.Id == bookingId, cancellationToken);

    public Task<Dispute?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
        => _context.Disputes.FirstOrDefaultAsync(dispute => dispute.Id == id, cancellationToken);

    public Task<Report?> GetReportByIdAsync(long id, CancellationToken cancellationToken = default)
        => _context.Reports.FirstOrDefaultAsync(report => report.Id == id, cancellationToken);

    public Task<InspectionReport?> GetInspectionReportAsync(long bookingId, string type, CancellationToken cancellationToken = default)
        => _context.InspectionReports.FirstOrDefaultAsync(report => report.BookingId == bookingId && report.Type == type, cancellationToken);

    public Task<bool> HasOpenDisputeForBookingAsync(long bookingId, CancellationToken cancellationToken = default)
        => _context.Disputes.AnyAsync(dispute =>
            dispute.BookingId == bookingId
            && dispute.Status != "Resolved", cancellationToken);

    public Task<decimal> GetCompletedPlatformSettlementForBookingAsync(long bookingId, CancellationToken cancellationToken = default)
        => _context.Disputes
            .Where(dispute => dispute.BookingId == bookingId && dispute.PlatformSettlementCompletedAt != null)
            .SumAsync(dispute => dispute.PlatformSettledAmount, cancellationToken);

    public Task<decimal> GetCompletedDepositRefundForBookingAsync(long bookingId, CancellationToken cancellationToken = default)
        => _context.WalletTransactions
            .Where(transaction =>
                transaction.Type == WalletTransactionType.Refund
                && transaction.Status == "Completed"
                && (transaction.IdempotencyKey == $"booking_deposit_refund_{bookingId}"
                    || (transaction.IdempotencyKey.StartsWith("dispute_deposit_refund_")
                        && _context.Disputes.Any(dispute =>
                            dispute.Id == transaction.ReferenceId
                            && dispute.BookingId == bookingId))))
            .SumAsync(transaction => transaction.Amount, cancellationToken);

    public async Task AddDisputeAsync(Dispute dispute, CancellationToken cancellationToken = default)
        => await _context.Disputes.AddAsync(dispute, cancellationToken);

    public async Task AddReportAsync(Report report, CancellationToken cancellationToken = default)
        => await _context.Reports.AddAsync(report, cancellationToken);

    public async Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
        => await _context.AuditLogs.AddAsync(auditLog, cancellationToken);

    public async Task AddEvidenceSubmissionAsync(DisputeEvidenceSubmission submission, CancellationToken cancellationToken = default)
        => await _context.DisputeEvidenceSubmissions.AddAsync(submission, cancellationToken);

    public void Update(Dispute dispute)
        => _context.Disputes.Update(dispute);

    public void UpdateReport(Report report)
        => _context.Reports.Update(report);

    public async Task<(List<DisputeListItem> Items, int TotalCount)> GetUserDisputesAsync(long userId, DisputeListRequest request, CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(BuildListQuery().Where(dispute => dispute.CustomerId == userId || dispute.OwnerId == userId), request);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await ApplyPaging(query, request).ToListAsync(cancellationToken);
        return (items, totalCount);
    }

    public async Task<(List<DisputeListItem> Items, int TotalCount)> GetStaffQueueAsync(DisputeListRequest request, CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(BuildListQuery(), request);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await ApplyPaging(query, request).ToListAsync(cancellationToken);
        return (items, totalCount);
    }

    public async Task<DisputeDetailResponse?> GetDetailByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await BuildListQuery().FirstOrDefaultAsync(dispute => dispute.Id == id, cancellationToken);
        if (item is null)
        {
            return null;
        }

        var inspectionReports = await GetInspectionReportsAsync(item.BookingId, cancellationToken);
        var images = await GetCheckInOutImagesAsync(item.BookingId, cancellationToken);

        return new DisputeDetailResponse
        {
            Id = item.Id,
            BookingId = item.BookingId,
            BookingCode = item.BookingCode,
            OpenedBy = item.OpenedBy,
            OpenedByName = item.OpenedByName,
            CustomerId = item.CustomerId,
            CustomerName = item.CustomerName,
            OwnerId = item.OwnerId,
            OwnerName = item.OwnerName,
            AssignedStaffId = item.AssignedStaffId,
            AssignedStaffName = item.AssignedStaffName,
            Status = item.Status,
            ReportType = item.ReportType,
            Description = item.Description,
            EvidenceUrls = item.EvidenceUrls,
            Resolution = item.Resolution,
            CompensationDirection = item.CompensationDirection,
            SettlementMethod = item.SettlementMethod,
            CompensationAmount = item.CompensationAmount,
            AdminApprovedAmount = item.AdminApprovedAmount,
            FinalCompensationAmount = item.FinalCompensationAmount,
            PlatformSettledAmount = item.PlatformSettledAmount,
            PlatformSettlementCompletedAt = item.PlatformSettlementCompletedAt,
            ExternalSettlementAmount = item.ExternalSettlementAmount,
            CustomerExternalConfirmed = item.CustomerExternalConfirmed,
            CustomerExternalConfirmedAt = item.CustomerExternalConfirmedAt,
            OwnerExternalConfirmed = item.OwnerExternalConfirmed,
            OwnerExternalConfirmedAt = item.OwnerExternalConfirmedAt,
            DecidedBy = item.DecidedBy,
            DecisionIssuedAt = item.DecisionIssuedAt,
            ClosedBy = item.ClosedBy,
            ClosedAt = item.ClosedAt,
            AdminCloseReason = item.AdminCloseReason,
            EscalatedBy = item.EscalatedBy,
            EscalatedAt = item.EscalatedAt,
            EvidenceRequestedFrom = item.EvidenceRequestedFrom,
            EvidenceRequestMessage = item.EvidenceRequestMessage,
            EvidenceRequestedAt = item.EvidenceRequestedAt,
            EvidenceRespondedAt = item.EvidenceRespondedAt,
            ResolvedAt = item.ResolvedAt,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            AuditLogs = await GetAuditLogsAsync(id, cancellationToken),
            EvidenceSubmissions = await GetEvidenceSubmissionsAsync(id, cancellationToken),
            InspectionReports = inspectionReports
                .Select(report => MapInspectionReport(report, images))
                .ToList()
        };
    }

    public async Task<List<InspectionReport>> GetInspectionReportsAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.InspectionReports
            .AsNoTracking()
            .Where(report => report.BookingId == bookingId)
            .OrderByDescending(report => report.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<CheckInOutImage>> GetCheckInOutImagesAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.CheckInOutImages
            .AsNoTracking()
            .Where(image => image.BookingId == bookingId)
            .OrderBy(image => image.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<DisputeEvidenceSubmissionItem>> GetEvidenceSubmissionsAsync(long disputeId, CancellationToken cancellationToken = default)
        => await (from submission in _context.DisputeEvidenceSubmissions.AsNoTracking()
                  join user in _context.Users.AsNoTracking() on submission.SubmittedBy equals user.Id
                  where submission.DisputeId == disputeId
                  orderby submission.CreatedAt
                  select new DisputeEvidenceSubmissionItem
                  {
                      Id = submission.Id,
                      SubmittedBy = submission.SubmittedBy,
                      SubmittedByName = user.FullName,
                      SubmittedRole = submission.SubmittedRole,
                      Message = submission.Message,
                      EvidenceUrls = submission.EvidenceUrls,
                      CreatedAt = submission.CreatedAt
                  }).ToListAsync(cancellationToken);

    public async Task<List<long>> GetStaffUserIdsAsync(CancellationToken cancellationToken = default)
        => await GetUserIdsByRolesAsync([UserRoleType.Staff.ToString()], cancellationToken);

    public async Task<List<long>> GetAdminUserIdsAsync(CancellationToken cancellationToken = default)
        => await GetUserIdsByRolesAsync([UserRoleType.Admin.ToString()], cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await action(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private IQueryable<DisputeListItem> BuildListQuery()
        => from dispute in _context.Disputes.AsNoTracking()
           join booking in _context.Bookings.AsNoTracking()
               on dispute.BookingId equals booking.Id
           join opener in _context.Users.AsNoTracking()
               on dispute.OpenedBy equals opener.Id
           join customer in _context.Users.AsNoTracking()
               on booking.CustomerId equals customer.Id
           join owner in _context.Users.AsNoTracking()
               on booking.OwnerId equals owner.Id
           join staffUser in _context.Users.AsNoTracking()
               on dispute.AssignedStaffId equals staffUser.Id into staffJoin
           from staff in staffJoin.DefaultIfEmpty()
           join reportRow in _context.Reports.AsNoTracking()
               on dispute.ReportId equals reportRow.Id into reportJoin
           from report in reportJoin.DefaultIfEmpty()
           select new DisputeListItem
           {
               Id = dispute.Id,
               BookingId = dispute.BookingId,
               BookingCode = booking.BookingCode,
               OpenedBy = dispute.OpenedBy,
               OpenedByName = opener.FullName,
               CustomerId = booking.CustomerId,
               CustomerName = customer.FullName,
               OwnerId = booking.OwnerId,
               OwnerName = owner.FullName,
               AssignedStaffId = dispute.AssignedStaffId,
               AssignedStaffName = staff == null ? null : staff.FullName,
               Status = dispute.Status,
               ReportType = report == null ? "Dispute" : report.ReportType,
               Description = report == null ? string.Empty : report.Description,
               EvidenceUrls = report == null ? null : report.EvidenceUrls,
               Resolution = dispute.Resolution,
               CompensationDirection = dispute.CompensationDirection,
               SettlementMethod = dispute.SettlementMethod,
               CompensationAmount = dispute.CompensationAmount,
               AdminApprovedAmount = dispute.AdminApprovedAmount,
               FinalCompensationAmount = dispute.AdminApprovedAmount ?? dispute.CompensationAmount,
               PlatformSettledAmount = dispute.PlatformSettledAmount,
               PlatformSettlementCompletedAt = dispute.PlatformSettlementCompletedAt,
               ExternalSettlementAmount = dispute.ExternalSettlementAmount,
               CustomerExternalConfirmed = dispute.CustomerExternalConfirmed,
               CustomerExternalConfirmedAt = dispute.CustomerExternalConfirmedAt,
               OwnerExternalConfirmed = dispute.OwnerExternalConfirmed,
               OwnerExternalConfirmedAt = dispute.OwnerExternalConfirmedAt,
               DecidedBy = dispute.DecidedBy,
               DecisionIssuedAt = dispute.DecisionIssuedAt,
               ClosedBy = dispute.ClosedBy,
               ClosedAt = dispute.ClosedAt,
               AdminCloseReason = dispute.AdminCloseReason,
               EscalatedBy = dispute.EscalatedBy,
               EscalatedAt = dispute.EscalatedAt,
               EvidenceRequestedFrom = dispute.EvidenceRequestedFrom,
               EvidenceRequestMessage = dispute.EvidenceRequestMessage,
               EvidenceRequestedAt = dispute.EvidenceRequestedAt,
               EvidenceRespondedAt = dispute.EvidenceRespondedAt,
               ResolvedAt = dispute.ResolvedAt,
               CreatedAt = dispute.CreatedAt,
               UpdatedAt = dispute.UpdatedAt
           };

    private static IQueryable<DisputeListItem> ApplyFilters(IQueryable<DisputeListItem> query, DisputeListRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim().ToLowerInvariant();
            query = query.Where(dispute => dispute.Status.ToLower() == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim().ToLowerInvariant();
            query = query.Where(dispute =>
                dispute.BookingCode.ToLower().Contains(keyword)
                || dispute.CustomerName.ToLower().Contains(keyword)
                || dispute.OwnerName.ToLower().Contains(keyword)
                || dispute.Description.ToLower().Contains(keyword));
        }

        return query;
    }

    private static IQueryable<DisputeListItem> ApplyPaging(IQueryable<DisputeListItem> query, DisputeListRequest request)
        => query
            .OrderByDescending(dispute => dispute.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize);

    private async Task<List<DisputeAuditLogItem>> GetAuditLogsAsync(long disputeId, CancellationToken cancellationToken)
        => await (from log in _context.AuditLogs.AsNoTracking()
                  join actor in _context.Users.AsNoTracking()
                      on log.ActorId equals actor.Id into actorJoin
                  from actor in actorJoin.DefaultIfEmpty()
                  where log.EntityType == "Dispute" && log.EntityId == disputeId
                  orderby log.CreatedAt
                  select new DisputeAuditLogItem
                  {
                      Id = log.Id,
                      ActorId = log.ActorId,
                      ActorRole = log.ActorRole,
                      ActorName = actor == null ? "System" : actor.FullName,
                      Action = log.Action,
                      OldValue = log.OldValue,
                      NewValue = log.NewValue,
                      CreatedAt = log.CreatedAt
                  })
            .ToListAsync(cancellationToken);

    private async Task<List<long>> GetUserIdsByRolesAsync(string[] roleNames, CancellationToken cancellationToken)
        => await _context.UserRoles
            .AsNoTracking()
            .Join(_context.Roles.AsNoTracking(),
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new { userRole.UserId, role.Name })
            .Where(row => roleNames.Contains(row.Name))
            .Select(row => row.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

    private static MoveVN.Application.Modules.Bookings.DTOs.InspectionReportResponse MapInspectionReport(
        InspectionReport report,
        IReadOnlyCollection<CheckInOutImage> images)
        => new()
        {
            Id = report.Id,
            BookingId = report.BookingId,
            Type = report.Type,
            CreatedByUserId = report.StaffId,
            OdometerKm = report.OdometerKm,
            FuelLevel = report.FuelLevel,
            DamageNoted = report.DamageNoted,
            DamageDescription = report.DamageDescription,
            ReportPdfUrl = report.ReportPdfUrl,
            CustomerSignatureUrl = report.CustomerSignatureUrl,
            IsCustomerConfirmed = false,
            CreatedAt = report.CreatedAt,
            Images = images
                .Where(image => image.InspectionId == report.Id)
                .Select(image => new MoveVN.Application.Modules.Bookings.DTOs.CheckInOutImageResponse
                {
                    Id = image.Id,
                    BookingId = image.BookingId,
                    InspectionId = image.InspectionId,
                    ImageUrl = image.ImageUrl,
                    ImageType = image.ImageType,
                    UploadedBy = image.UploadedBy,
                    CreatedAt = image.CreatedAt,
                })
                .ToList()
        };
}
