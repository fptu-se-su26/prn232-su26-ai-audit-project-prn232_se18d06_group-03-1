using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.SupportTickets.DTOs;
using MoveVN.Application.Modules.SupportTickets.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.SupportTickets.Services;

public class SupportTicketService : ISupportTicketService
{
    private const int MaxPageSize = 50;
    private static readonly string[] Priorities = ["Low", "Normal", "High", "Urgent"];
    private static readonly string[] Statuses = ["Open", "InProgress", "Resolved", "Closed"];

    private readonly ISupportTicketRepository _repository;
    private readonly INotificationService _notificationService;

    public SupportTicketService(
        ISupportTicketRepository repository,
        INotificationService notificationService)
    {
        _repository = repository;
        _notificationService = notificationService;
    }

    public async Task<SupportTicketDetailResponse> CreateAsync(CreateSupportTicketRequest request, long customerId, CancellationToken cancellationToken = default)
    {
        var ticket = new SupportTicket
        {
            UserId = customerId,
            TicketNumber = GenerateTicketNumber(),
            Category = request.Category.Trim(),
            Subject = request.Subject.Trim(),
            Status = "Open",
            Priority = Normalize(request.Priority, Priorities, "Normal"),
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(ticket, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        await _repository.AddMessageAsync(new TicketMessage
        {
            TicketId = ticket.Id,
            SenderId = customerId,
            Message = request.Message.Trim(),
            AttachmentUrls = NormalizeNullable(request.AttachmentUrls),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        await NotifyStaffAsync(ticket, "Support ticket mới", $"{ticket.TicketNumber}: {ticket.Subject}", cancellationToken);

        return await GetDetailOrThrowAsync(ticket.Id, cancellationToken);
    }

    public async Task<PagedResult<SupportTicketListItem>> GetMineAsync(long customerId, SupportTicketListRequest request, CancellationToken cancellationToken = default)
    {
        NormalizePaging(request);
        var (items, totalCount) = await _repository.GetUserTicketsAsync(customerId, request, cancellationToken);
        return ToPagedResult(items, totalCount, request);
    }

    public async Task<PagedResult<SupportTicketListItem>> GetStaffQueueAsync(SupportTicketListRequest request, CancellationToken cancellationToken = default)
    {
        NormalizePaging(request);
        var (items, totalCount) = await _repository.GetStaffTicketsAsync(request, cancellationToken);
        return ToPagedResult(items, totalCount, request);
    }

    public async Task<SupportTicketDetailResponse> GetByIdAsync(long ticketId, long currentUserId, bool isStaffOrAdmin, CancellationToken cancellationToken = default)
    {
        var ticket = await _repository.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException("Support ticket not found.");

        if (!isStaffOrAdmin && ticket.UserId != currentUserId)
        {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return await GetDetailOrThrowAsync(ticketId, cancellationToken);
    }

    public async Task<SupportTicketDetailResponse> AddMessageAsync(long ticketId, long senderId, bool isStaffOrAdmin, AddTicketMessageRequest request, CancellationToken cancellationToken = default)
    {
        var ticket = await _repository.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException("Support ticket not found.");

        if (!isStaffOrAdmin && ticket.UserId != senderId)
        {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (ticket.Status is "Closed" or "Resolved")
        {
            throw new ValidationException(["Ticket is already closed."]);
        }

        if (isStaffOrAdmin)
        {
            ticket.AssignedStaffId ??= senderId;
            if (ticket.Status == "Open")
            {
                ticket.Status = "InProgress";
            }
        }

        await _repository.AddMessageAsync(new TicketMessage
        {
            TicketId = ticket.Id,
            SenderId = senderId,
            Message = request.Message.Trim(),
            AttachmentUrls = NormalizeNullable(request.AttachmentUrls),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        _repository.Update(ticket);
        await _repository.SaveChangesAsync(cancellationToken);

        if (isStaffOrAdmin)
        {
            await NotifyUserAsync(ticket.UserId, ticket, "Staff đã phản hồi ticket", $"{ticket.TicketNumber}: {ticket.Subject}", cancellationToken);
        }
        else
        {
            await NotifyAssignedStaffOrQueueAsync(ticket, "Customer đã phản hồi ticket", $"{ticket.TicketNumber}: {ticket.Subject}", cancellationToken);
        }

        return await GetDetailOrThrowAsync(ticket.Id, cancellationToken);
    }

    public async Task<SupportTicketDetailResponse> UpdateStatusAsync(long ticketId, long staffId, UpdateSupportTicketStatusRequest request, CancellationToken cancellationToken = default)
    {
        var ticket = await _repository.GetByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException("Support ticket not found.");

        ticket.Status = Normalize(request.Status, Statuses, "Open");
        ticket.AssignedStaffId ??= staffId;
        ticket.ResolvedAt = ticket.Status is "Resolved" or "Closed" ? DateTime.UtcNow : null;

        _repository.Update(ticket);
        await _repository.SaveChangesAsync(cancellationToken);

        await NotifyUserAsync(ticket.UserId, ticket, "Ticket hỗ trợ đã cập nhật", $"{ticket.TicketNumber} chuyển sang {ticket.Status}.", cancellationToken);

        return await GetDetailOrThrowAsync(ticket.Id, cancellationToken);
    }

    private async Task<SupportTicketDetailResponse> GetDetailOrThrowAsync(long ticketId, CancellationToken cancellationToken)
        => await _repository.GetDetailByIdAsync(ticketId, cancellationToken)
            ?? throw new NotFoundException("Support ticket not found.");

    private async Task NotifyAssignedStaffOrQueueAsync(SupportTicket ticket, string title, string body, CancellationToken cancellationToken)
    {
        if (ticket.AssignedStaffId.HasValue)
        {
            await NotifyUserAsync(ticket.AssignedStaffId.Value, ticket, title, body, cancellationToken);
            return;
        }

        await NotifyStaffAsync(ticket, title, body, cancellationToken);
    }

    private async Task NotifyStaffAsync(SupportTicket ticket, string title, string body, CancellationToken cancellationToken)
    {
        var staffIds = await _repository.GetStaffAndAdminUserIdsAsync(cancellationToken);
        foreach (var staffId in staffIds.Distinct())
        {
            await NotifyUserAsync(staffId, ticket, title, body, cancellationToken);
        }
    }

    private async Task NotifyUserAsync(long userId, SupportTicket ticket, string title, string body, CancellationToken cancellationToken)
    {
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "SupportTicket",
            Title = title,
            Body = body,
            DataJson = JsonSerializer.Serialize(new
            {
                ticketId = ticket.Id,
                ticketNumber = ticket.TicketNumber,
                status = ticket.Status
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    private static void NormalizePaging(SupportTicketListRequest request)
    {
        request.Page = Math.Max(request.Page, 1);
        request.PageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);
        request.Status = NormalizeNullable(request.Status);
        request.Priority = NormalizeNullable(request.Priority);
        request.Category = NormalizeNullable(request.Category);
        request.Keyword = NormalizeNullable(request.Keyword);
    }

    private static PagedResult<SupportTicketListItem> ToPagedResult(List<SupportTicketListItem> items, int totalCount, SupportTicketListRequest request)
        => new()
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };

    private static string GenerateTicketNumber()
    {
        var now = DateTime.UtcNow;
        return $"TK{now:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}";
    }

    private static string Normalize(string value, string[] allowed, string fallback)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        return allowed.FirstOrDefault(option => string.Equals(option, value.Trim(), StringComparison.OrdinalIgnoreCase)) ?? fallback;
    }

    private static string? NormalizeNullable(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
