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

    public Task<bool> HasOpenDisputeForBookingAsync(long bookingId, CancellationToken cancellationToken = default)
        => _context.Disputes.AnyAsync(dispute =>
            dispute.BookingId == bookingId
            && dispute.Status != "Resolved", cancellationToken);

    public async Task AddDisputeAsync(Dispute dispute, CancellationToken cancellationToken = default)
        => await _context.Disputes.AddAsync(dispute, cancellationToken);

    public async Task AddReportAsync(Report report, CancellationToken cancellationToken = default)
        => await _context.Reports.AddAsync(report, cancellationToken);

    public async Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
        => await _context.AuditLogs.AddAsync(auditLog, cancellationToken);

    public void Update(Dispute dispute)
        => _context.Disputes.Update(dispute);

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
            CompensationAmount = item.CompensationAmount,
            ResolvedAt = item.ResolvedAt,
            CreatedAt = item.CreatedAt,
            AuditLogs = await GetAuditLogsAsync(id, cancellationToken)
        };
    }

    public async Task<List<long>> GetStaffUserIdsAsync(CancellationToken cancellationToken = default)
        => await GetUserIdsByRolesAsync([UserRoleType.Staff.ToString()], cancellationToken);

    public async Task<List<long>> GetAdminUserIdsAsync(CancellationToken cancellationToken = default)
        => await GetUserIdsByRolesAsync([UserRoleType.Admin.ToString()], cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

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
               CompensationAmount = dispute.CompensationAmount,
               ResolvedAt = dispute.ResolvedAt,
               CreatedAt = dispute.CreatedAt
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
}
