using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.SupportTickets.DTOs;

namespace MoveVN.Application.Modules.SupportTickets.Interfaces;

public interface ISupportTicketService
{
    Task<SupportTicketDetailResponse> CreateAsync(CreateSupportTicketRequest request, long customerId, CancellationToken cancellationToken = default);
    Task<PagedResult<SupportTicketListItem>> GetMineAsync(long customerId, SupportTicketListRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<SupportTicketListItem>> GetStaffQueueAsync(SupportTicketListRequest request, CancellationToken cancellationToken = default);
    Task<SupportTicketDetailResponse> GetByIdAsync(long ticketId, long currentUserId, bool isStaffOrAdmin, CancellationToken cancellationToken = default);
    Task<SupportTicketDetailResponse> AddMessageAsync(long ticketId, long senderId, bool isStaffOrAdmin, AddTicketMessageRequest request, CancellationToken cancellationToken = default);
    Task<SupportTicketDetailResponse> UpdateStatusAsync(long ticketId, long staffId, UpdateSupportTicketStatusRequest request, CancellationToken cancellationToken = default);
    Task<string> UploadAttachmentAsync(Stream fileStream, string fileName, long userId, CancellationToken cancellationToken = default);
}
