using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reports.Services;

public class SupportTicketService : ISupportTicketService
{
    private readonly ISupportTicketRepository _repo;
    private readonly INotificationService _notifications;

    public SupportTicketService(ISupportTicketRepository repo, INotificationService notifications)
    {
        _repo = repo;
        _notifications = notifications;
    }

    public async Task<SupportTicketDto> CreateAsync(CreateTicketRequest request, long userId, CancellationToken cancellationToken = default)
    {
        var ticket = new SupportTicket
        {
            UserId = userId,
            TicketNumber = $"TKT{DateTime.UtcNow:yyyyMMddHHmm}{Random.Shared.Next(100, 999)}",
            Category = request.Category,
            Subject = request.Subject,
            Status = "Open",
            Priority = "Normal"
        };

        await _repo.AddAsync(ticket, cancellationToken);

        var firstMsg = new TicketMessage
        {
            TicketId = ticket.Id,
            SenderId = userId,
            Message = request.Content
        };
        await _repo.AddMessageAsync(firstMsg, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        // Notify all staff (simplified: notify with userId=0 as broadcast)
        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = 0, // staff group — actual impl targets staff users
            Type = "NewTicket",
            Title = "Support ticket mới",
            Body = $"Ticket #{ticket.TicketNumber}: {ticket.Subject}"
        }));

        return MapToDto(ticket);
    }

    public async Task<TicketMessageDto> ReplyAsync(long ticketId, SendTicketMessageRequest request, long senderId, CancellationToken cancellationToken = default)
    {
        var ticket = await _repo.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException("Ticket không tồn tại.");

        if (ticket.Status == "Closed")
            throw new ValidationException(new[] { "Ticket đã đóng." });

        ticket.Status = "InProgress";
        _repo.Update(ticket);

        var msg = new TicketMessage
        {
            TicketId = ticketId,
            SenderId = senderId,
            Message = request.Message
        };
        await _repo.AddMessageAsync(msg, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        // Notify ticket owner
        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = ticket.UserId,
            Type = "TicketReply",
            Title = "Ticket được phản hồi",
            Body = $"Ticket #{ticket.TicketNumber} có phản hồi mới."
        }));

        return new TicketMessageDto { Id = msg.Id, SenderId = msg.SenderId, Message = msg.Message, CreatedAt = msg.CreatedAt };
    }

    public async Task<PagedResult<SupportTicketDto>> GetQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _repo.GetQueueAsync(page, pageSize, cancellationToken);
    }

    public async Task<List<TicketMessageDto>> GetMessagesAsync(long ticketId, CancellationToken cancellationToken = default)
    {
        return await _repo.GetMessagesAsync(ticketId, cancellationToken);
    }

    public async Task CloseAsync(long ticketId, long staffId, CancellationToken cancellationToken = default)
    {
        var ticket = await _repo.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException("Ticket không tồn tại.");
        ticket.Status = "Closed";
        ticket.ResolvedAt = DateTime.UtcNow;
        ticket.AssignedStaffId = staffId;
        _repo.Update(ticket);
        await _repo.SaveChangesAsync(cancellationToken);
    }

    private static SupportTicketDto MapToDto(SupportTicket t) => new()
    {
        Id = t.Id,
        TicketNumber = t.TicketNumber,
        Subject = t.Subject,
        Category = t.Category,
        Status = t.Status,
        Priority = t.Priority,
        CreatedAt = t.CreatedAt
    };
}
