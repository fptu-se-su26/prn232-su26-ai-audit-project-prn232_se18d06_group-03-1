using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.SupportTickets.DTOs;
using MoveVN.Application.Modules.SupportTickets.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Infrastructure.Persistence.Repositories.SupportTickets;

public class SupportTicketRepository : ISupportTicketRepository
{
    private readonly AppDbContext _context;

    public SupportTicketRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(SupportTicket ticket, CancellationToken cancellationToken = default)
        => await _context.SupportTickets.AddAsync(ticket, cancellationToken);

    public async Task AddMessageAsync(TicketMessage message, CancellationToken cancellationToken = default)
        => await _context.TicketMessages.AddAsync(message, cancellationToken);

    public async Task<SupportTicket?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
        => await _context.SupportTickets.FirstOrDefaultAsync(ticket => ticket.Id == id, cancellationToken);

    public async Task<SupportTicketDetailResponse?> GetDetailByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await BuildListQuery()
            .FirstOrDefaultAsync(ticket => ticket.Id == id, cancellationToken);

        if (item is null)
        {
            return null;
        }

        return ToDetail(item, await GetMessagesAsync(id, cancellationToken));
    }

    public async Task<(List<SupportTicketListItem> Items, int TotalCount)> GetUserTicketsAsync(long userId, SupportTicketListRequest request, CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(BuildListQuery().Where(ticket => ticket.UserId == userId), request);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await ApplyPaging(query, request).ToListAsync(cancellationToken);
        return (items, totalCount);
    }

    public async Task<(List<SupportTicketListItem> Items, int TotalCount)> GetStaffTicketsAsync(SupportTicketListRequest request, CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(BuildListQuery(), request);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await ApplyPaging(query, request).ToListAsync(cancellationToken);
        return (items, totalCount);
    }

    public async Task<List<long>> GetStaffAndAdminUserIdsAsync(CancellationToken cancellationToken = default)
    {
        var roleNames = new[] { UserRoleType.Staff.ToString(), UserRoleType.Admin.ToString() };

        return await _context.UserRoles
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

    public void Update(SupportTicket ticket)
        => _context.SupportTickets.Update(ticket);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    private IQueryable<SupportTicketListItem> BuildListQuery()
        => from ticket in _context.SupportTickets.AsNoTracking()
           join customer in _context.Users.AsNoTracking()
               on ticket.UserId equals customer.Id
           join staffUser in _context.Users.AsNoTracking()
               on ticket.AssignedStaffId equals staffUser.Id into staffJoin
           from staff in staffJoin.DefaultIfEmpty()
           select new SupportTicketListItem
           {
               Id = ticket.Id,
               UserId = ticket.UserId,
               CustomerName = customer.FullName,
               TicketNumber = ticket.TicketNumber,
               Category = ticket.Category,
               Subject = ticket.Subject,
               Status = ticket.Status,
               AssignedStaffId = ticket.AssignedStaffId,
               AssignedStaffName = staff == null ? null : staff.FullName,
               Priority = ticket.Priority,
               MessageCount = _context.TicketMessages.Count(message => message.TicketId == ticket.Id),
               LastMessageAt = _context.TicketMessages
                   .Where(message => message.TicketId == ticket.Id)
                   .OrderByDescending(message => message.CreatedAt)
                   .Select(message => (DateTime?)message.CreatedAt)
                   .FirstOrDefault(),
               ResolvedAt = ticket.ResolvedAt,
               CreatedAt = ticket.CreatedAt
           };

    private static IQueryable<SupportTicketListItem> ApplyFilters(IQueryable<SupportTicketListItem> query, SupportTicketListRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim().ToLowerInvariant();
            query = query.Where(ticket => ticket.Status.ToLower() == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Priority))
        {
            var priority = request.Priority.Trim().ToLowerInvariant();
            query = query.Where(ticket => ticket.Priority.ToLower() == priority);
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var category = request.Category.Trim().ToLowerInvariant();
            query = query.Where(ticket => ticket.Category.ToLower() == category);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim().ToLowerInvariant();
            query = query.Where(ticket =>
                ticket.TicketNumber.ToLower().Contains(keyword)
                || ticket.Subject.ToLower().Contains(keyword)
                || ticket.CustomerName.ToLower().Contains(keyword));
        }

        return query;
    }

    private static IQueryable<SupportTicketListItem> ApplyPaging(IQueryable<SupportTicketListItem> query, SupportTicketListRequest request)
        => query
            .OrderByDescending(ticket => ticket.LastMessageAt ?? ticket.CreatedAt)
            .ThenByDescending(ticket => ticket.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize);

    private async Task<List<TicketMessageResponse>> GetMessagesAsync(long ticketId, CancellationToken cancellationToken)
    {
        var messages = await (from message in _context.TicketMessages.AsNoTracking()
                              join user in _context.Users.AsNoTracking()
                                  on message.SenderId equals user.Id into userJoin
                              from sender in userJoin.DefaultIfEmpty()
                              where message.TicketId == ticketId
                              orderby message.CreatedAt
                              select new TicketMessageResponse
                              {
                                  Id = message.Id,
                                  TicketId = message.TicketId,
                                  SenderId = message.SenderId,
                                  SenderName = sender == null ? "Unknown" : sender.FullName,
                                  Message = message.Message,
                                  AttachmentUrls = message.AttachmentUrls,
                                  CreatedAt = message.CreatedAt
                              })
            .ToListAsync(cancellationToken);

        var senderIds = messages.Select(message => message.SenderId).Distinct().ToArray();
        if (senderIds.Length == 0)
        {
            return messages;
        }

        var roleRows = await _context.UserRoles
            .AsNoTracking()
            .Where(userRole => senderIds.Contains(userRole.UserId))
            .Join(_context.Roles.AsNoTracking(),
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new { userRole.UserId, role.Name })
            .ToListAsync(cancellationToken);

        var rolesByUser = roleRows
            .GroupBy(row => row.UserId)
            .ToDictionary(
                group => group.Key,
                group => group.Select(row => row.Name).OrderBy(name => name).ToList());

        foreach (var message in messages)
        {
            if (rolesByUser.TryGetValue(message.SenderId, out var roles))
            {
                message.SenderRoles = roles;
            }
        }

        return messages;
    }

    private static SupportTicketDetailResponse ToDetail(SupportTicketListItem item, List<TicketMessageResponse> messages)
        => new()
        {
            Id = item.Id,
            UserId = item.UserId,
            CustomerName = item.CustomerName,
            TicketNumber = item.TicketNumber,
            Category = item.Category,
            Subject = item.Subject,
            Status = item.Status,
            AssignedStaffId = item.AssignedStaffId,
            AssignedStaffName = item.AssignedStaffName,
            Priority = item.Priority,
            MessageCount = item.MessageCount,
            LastMessageAt = item.LastMessageAt,
            ResolvedAt = item.ResolvedAt,
            CreatedAt = item.CreatedAt,
            Messages = messages
        };
}
