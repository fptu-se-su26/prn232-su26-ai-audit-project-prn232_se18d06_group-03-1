using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Reports.DTOs;

namespace MoveVN.Application.Modules.Reports.Interfaces;

public interface IDisputeService
{
    Task<DisputeResponse> OpenAsync(CreateDisputeRequest request, long openedBy, CancellationToken cancellationToken = default);
    Task<DisputeResponse> ResolveAsync(long disputeId, long staffId, ResolveDisputeRequest request, CancellationToken cancellationToken = default);
    Task<DisputeResponse> GetByIdAsync(long disputeId, CancellationToken cancellationToken = default);
    Task<PagedResult<DisputeResponse>> GetListAsync(string? status, int page, int pageSize, CancellationToken cancellationToken = default);
}

public interface ISupportTicketService
{
    Task<SupportTicketDto> CreateAsync(CreateTicketRequest request, long userId, CancellationToken cancellationToken = default);
    Task<PagedResult<SupportTicketDto>> GetMyTicketsAsync(long userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<SupportTicketDetailDto> GetByIdAsync(long ticketId, CancellationToken cancellationToken = default);
    Task<TicketMessageDto> ReplyAsync(long ticketId, SendTicketMessageRequest request, long senderId, CancellationToken cancellationToken = default);
    Task<PagedResult<SupportTicketDto>> GetQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<List<TicketMessageDto>> GetMessagesAsync(long ticketId, CancellationToken cancellationToken = default);
    Task CloseAsync(long ticketId, long staffId, CancellationToken cancellationToken = default);
}
