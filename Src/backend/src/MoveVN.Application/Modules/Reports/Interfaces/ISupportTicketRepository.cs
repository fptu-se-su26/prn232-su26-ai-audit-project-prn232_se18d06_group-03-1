using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reports.Interfaces;

public interface ISupportTicketRepository
{
    Task<SupportTicket?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(SupportTicket ticket, CancellationToken cancellationToken = default);
    void Update(SupportTicket ticket);
    Task AddMessageAsync(TicketMessage message, CancellationToken cancellationToken = default);
    Task<PagedResult<SupportTicketDto>> GetQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<SupportTicketDto>> GetByUserAsync(long userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<SupportTicketDetailDto?> GetDetailAsync(long ticketId, CancellationToken cancellationToken = default);
    Task<List<TicketMessageDto>> GetMessagesAsync(long ticketId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
