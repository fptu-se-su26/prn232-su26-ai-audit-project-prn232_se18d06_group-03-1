using MoveVN.Application.Modules.SupportTickets.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.SupportTickets.Interfaces;

public interface ISupportTicketRepository
{
    Task AddAsync(SupportTicket ticket, CancellationToken cancellationToken = default);
    Task AddMessageAsync(TicketMessage message, CancellationToken cancellationToken = default);
    Task<SupportTicket?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<SupportTicketDetailResponse?> GetDetailByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<(List<SupportTicketListItem> Items, int TotalCount)> GetUserTicketsAsync(long userId, SupportTicketListRequest request, CancellationToken cancellationToken = default);
    Task<(List<SupportTicketListItem> Items, int TotalCount)> GetStaffTicketsAsync(SupportTicketListRequest request, CancellationToken cancellationToken = default);
    Task<List<long>> GetStaffAndAdminUserIdsAsync(CancellationToken cancellationToken = default);
    void Update(SupportTicket ticket);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
