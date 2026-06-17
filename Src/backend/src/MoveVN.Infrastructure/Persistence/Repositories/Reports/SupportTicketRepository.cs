using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Reports;

public class SupportTicketRepository : ISupportTicketRepository
{
    private readonly AppDbContext _context;

    public SupportTicketRepository(AppDbContext context) => _context = context;

    public async Task<SupportTicket?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task AddAsync(SupportTicket ticket, CancellationToken ct = default)
        => await _context.SupportTickets.AddAsync(ticket, ct);

    public void Update(SupportTicket ticket) => _context.SupportTickets.Update(ticket);

    public async Task AddMessageAsync(TicketMessage message, CancellationToken ct = default)
        => await _context.TicketMessages.AddAsync(message, ct);

    public async Task<PagedResult<SupportTicketDto>> GetQueueAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.SupportTickets.OrderByDescending(t => t.CreatedAt).AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new SupportTicketDto
            {
                Id = t.Id,
                UserId = t.UserId,
                TicketNumber = t.TicketNumber,
                Subject = t.Subject,
                Category = t.Category,
                Status = t.Status,
                AssignedStaffId = t.AssignedStaffId,
                Priority = t.Priority,
                CreatedAt = t.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<SupportTicketDto>.Create(items, total, page, pageSize);
    }

    public async Task<PagedResult<SupportTicketDto>> GetByUserAsync(long userId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.SupportTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt);
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new SupportTicketDto
            {
                Id = t.Id,
                UserId = t.UserId,
                TicketNumber = t.TicketNumber,
                Subject = t.Subject,
                Category = t.Category,
                Status = t.Status,
                AssignedStaffId = t.AssignedStaffId,
                Priority = t.Priority,
                CreatedAt = t.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<SupportTicketDto>.Create(items, total, page, pageSize);
    }

    public async Task<SupportTicketDetailDto?> GetDetailAsync(long ticketId, CancellationToken ct = default)
    {
        var ticket = await _context.SupportTickets
            .Where(t => t.Id == ticketId)
            .Select(t => new SupportTicketDetailDto
            {
                Id = t.Id,
                UserId = t.UserId,
                TicketNumber = t.TicketNumber,
                Subject = t.Subject,
                Category = t.Category,
                Status = t.Status,
                AssignedStaffId = t.AssignedStaffId,
                Priority = t.Priority,
                CreatedAt = t.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

        if (ticket is null)
            return null;

        ticket.Messages = await GetMessagesAsync(ticketId, ct);
        return ticket;
    }

    public async Task<List<TicketMessageDto>> GetMessagesAsync(long ticketId, CancellationToken ct = default)
        => await _context.TicketMessages.Where(m => m.TicketId == ticketId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new TicketMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                Message = m.Message,
                CreatedAt = m.CreatedAt
            }).ToListAsync(ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
