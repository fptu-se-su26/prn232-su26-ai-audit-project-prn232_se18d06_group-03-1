using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Reports;

public class DisputeRepository : IDisputeRepository
{
    private readonly AppDbContext _context;

    public DisputeRepository(AppDbContext context) => _context = context;

    public async Task<Dispute?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.Disputes.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task AddAsync(Dispute dispute, CancellationToken ct = default)
        => await _context.Disputes.AddAsync(dispute, ct);

    public async Task AddEvidenceAsync(DisputeEvidence evidence, CancellationToken ct = default)
        => await _context.DisputeEvidences.AddAsync(evidence, ct);

    public async Task<List<string>> GetEvidenceUrlsAsync(long disputeId, CancellationToken ct = default)
        => await _context.DisputeEvidences
            .Where(x => x.DisputeId == disputeId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => x.EvidenceUrl)
            .ToListAsync(ct);

    public void Update(Dispute dispute) => _context.Disputes.Update(dispute);

    public async Task<Booking?> GetBookingAsync(long bookingId, CancellationToken ct = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);

    public async Task<PagedResult<DisputeResponse>> GetPagedAsync(string? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.Disputes.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(d => d.Status == status);
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(d => new DisputeResponse
            {
                Id = d.Id,
                BookingId = d.BookingId,
                OpenedBy = d.OpenedBy,
                AssignedStaffId = d.AssignedStaffId,
                Status = d.Status,
                Resolution = d.Resolution,
                CompensationAmount = d.CompensationAmount,
                ResolvedAt = d.ResolvedAt,
                CreatedAt = d.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<DisputeResponse>.Create(items, total, page, pageSize);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
