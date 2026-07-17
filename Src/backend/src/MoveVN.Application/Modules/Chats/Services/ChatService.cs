using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Chats.DTOs;
using MoveVN.Application.Modules.Chats.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Chats.Services;

public class ChatService : IChatService
{
    private const int MaxPageSize = 50;
    private const int MaxMessageLength = 2000;
    private readonly IBookingRepository _bookingRepository;
    private readonly IUserRepository _userRepository;
    private readonly IChatRepository _chatRepository;
    private readonly IChatRealtimeDispatcher _realtimeDispatcher;
    private readonly INotificationService _notificationService;

    public ChatService(
        IBookingRepository bookingRepository,
        IUserRepository userRepository,
        IChatRepository chatRepository,
        IChatRealtimeDispatcher realtimeDispatcher,
        INotificationService notificationService)
    {
        _bookingRepository = bookingRepository;
        _userRepository = userRepository;
        _chatRepository = chatRepository;
        _realtimeDispatcher = realtimeDispatcher;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<ChatRoomResponse>> GetRoomsAsync(long userId, ChatRoomListRequest request, CancellationToken cancellationToken = default)
    {
        var page = Math.Max(request.Page, 1);
        var pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);

        var totalCount = await _chatRepository.CountRoomsByUserIdAsync(userId, cancellationToken);
        var rooms = await _chatRepository.GetRoomsByUserIdAsync(userId, page, pageSize, cancellationToken);
        var responses = new List<ChatRoomResponse>();

        foreach (var room in rooms)
        {
            responses.Add(await MapRoomAsync(room, userId, cancellationToken));
        }

        return new PagedResult<ChatRoomResponse>
        {
            Items = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ChatRoomResponse> GetOrCreateRoomByBookingAsync(long bookingId, long userId, CancellationToken cancellationToken = default)
    {
        var booking = await GetAccessibleBookingAsync(bookingId, userId, cancellationToken);
        var room = await _chatRepository.GetRoomByBookingIdAsync(bookingId, cancellationToken);

        if (room is null)
        {
            var now = DateTime.UtcNow;
            room = new ChatRoomDocument
            {
                BookingId = booking.Id.ToString(),
                RoomType = "booking",
                Participants =
                [
                    new ChatParticipantDocument
                    {
                        UserId = booking.CustomerId.ToString(),
                        Role = "Customer",
                        JoinedAt = now
                    },
                    new ChatParticipantDocument
                    {
                        UserId = booking.OwnerId.ToString(),
                        Role = "Owner",
                        JoinedAt = now
                    }
                ],
                UnreadCount = new Dictionary<string, int>
                {
                    [booking.CustomerId.ToString()] = 0,
                    [booking.OwnerId.ToString()] = 0
                },
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _chatRepository.AddRoomAsync(room, cancellationToken);
        }

        return await MapRoomAsync(room, userId, cancellationToken, booking);
    }

    public async Task<ChatRoomResponse> GetRoomByIdAsync(string roomId, long userId, CancellationToken cancellationToken = default)
    {
        var room = await GetAccessibleRoomAsync(roomId, userId, cancellationToken);
        return await MapRoomAsync(room, userId, cancellationToken);
    }

    public async Task<bool> CanAccessRoomAsync(string roomId, long userId, CancellationToken cancellationToken = default)
    {
        var room = await _chatRepository.GetRoomByIdAsync(roomId, cancellationToken);
        return room is not null && IsParticipant(room, userId);
    }

    public async Task<PagedResult<ChatMessageResponse>> GetMessagesAsync(string roomId, long userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var room = await GetAccessibleRoomAsync(roomId, userId, cancellationToken);
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var totalCount = await _chatRepository.CountMessagesAsync(room.Id!, cancellationToken);
        var messages = await _chatRepository.GetMessagesAsync(room.Id!, page, pageSize, cancellationToken);

        return new PagedResult<ChatMessageResponse>
        {
            Items = await MapMessagesAsync(room, messages, cancellationToken),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ChatMessageResponse> SendMessageAsync(string roomId, long senderId, SendChatMessageRequest request, CancellationToken cancellationToken = default)
    {
        var room = await GetAccessibleRoomAsync(roomId, senderId, cancellationToken);
        var content = request.Content.Trim();
        if (string.IsNullOrWhiteSpace(content) || content.Length > MaxMessageLength)
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR, [$"Message content is required and must be at most {MaxMessageLength} characters."]);
        }

        var sender = room.Participants.First(participant => participant.UserId == senderId.ToString());
        var now = DateTime.UtcNow;
        var message = new ChatMessageDocument
        {
            RoomId = room.Id!,
            SenderId = senderId.ToString(),
            SenderRole = sender.Role,
            MessageType = "text",
            Content = content,
            IsRead = false,
            SentAt = now
        };

        await _chatRepository.AddMessageAsync(message, cancellationToken);

        room.LastMessage = new LastMessageDocument
        {
            Text = content,
            SenderId = senderId.ToString(),
            SentAt = now
        };
        foreach (var participant in room.Participants.Where(participant => participant.UserId != senderId.ToString()))
        {
            room.UnreadCount.TryGetValue(participant.UserId, out var unread);
            room.UnreadCount[participant.UserId] = unread + 1;
        }
        room.UpdatedAt = now;
        await _chatRepository.ReplaceRoomAsync(room, cancellationToken);

        var messageResponse = (await MapMessagesAsync(room, [message], cancellationToken)).Single();
        var roomResponse = await MapRoomAsync(room, senderId, cancellationToken);
        var participantIds = GetParticipantIds(room);

        await _realtimeDispatcher.SendMessageCreatedAsync(room.Id!, participantIds, new ChatMessageCreatedPayload
        {
            Message = messageResponse,
            Room = roomResponse
        }, cancellationToken);

        await NotifyRecipientsAsync(room, senderId, content, cancellationToken);
        return messageResponse;
    }

    public async Task<ChatRoomResponse> MarkRoomAsReadAsync(string roomId, long readerUserId, CancellationToken cancellationToken = default)
    {
        var room = await GetAccessibleRoomAsync(roomId, readerUserId, cancellationToken);
        await _chatRepository.MarkMessagesReadAsync(room.Id!, readerUserId, cancellationToken);
        room.UnreadCount[readerUserId.ToString()] = 0;
        room.UpdatedAt = DateTime.UtcNow;
        await _chatRepository.ReplaceRoomAsync(room, cancellationToken);

        var roomResponse = await MapRoomAsync(room, readerUserId, cancellationToken);
        await _realtimeDispatcher.SendRoomUpdatedAsync(room.Id!, [readerUserId], roomResponse, cancellationToken);
        return roomResponse;
    }

    private async Task<Booking> GetAccessibleBookingAsync(long bookingId, long userId, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new AppException(ErrorCode.BOOKING_NOT_FOUND);

        if (booking.CustomerId != userId && booking.OwnerId != userId)
        {
            throw new AppException(ErrorCode.FORBIDDEN, ["Only the booking customer or owner can access this chat."]);
        }

        return booking;
    }

    private async Task<ChatRoomDocument> GetAccessibleRoomAsync(string roomId, long userId, CancellationToken cancellationToken)
    {
        var room = await _chatRepository.GetRoomByIdAsync(roomId, cancellationToken)
            ?? throw new AppException(ErrorCode.NOT_FOUND, ["Chat room not found."]);

        if (!IsParticipant(room, userId))
        {
            throw new AppException(ErrorCode.FORBIDDEN, ["Only chat room participants can access this chat."]);
        }

        return room;
    }

    private async Task<ChatRoomResponse> MapRoomAsync(ChatRoomDocument room, long currentUserId, CancellationToken cancellationToken, Booking? booking = null)
    {
        booking ??= long.TryParse(room.BookingId, out var bookingId)
            ? await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            : null;

        var customer = booking is null ? null : await _userRepository.GetByIdAsync(booking.CustomerId, cancellationToken);
        var owner = booking is null ? null : await _userRepository.GetByIdAsync(booking.OwnerId, cancellationToken);
        var vehicle = booking is null ? null : await _bookingRepository.GetVehicleByIdAsync(booking.VehicleId, cancellationToken);

        room.UnreadCount.TryGetValue(currentUserId.ToString(), out var unreadCount);

        return new ChatRoomResponse
        {
            Id = room.Id ?? string.Empty,
            BookingId = booking?.Id ?? 0,
            BookingCode = booking?.BookingCode ?? room.BookingId,
            CustomerId = booking?.CustomerId ?? 0,
            CustomerName = customer?.FullName ?? "Customer",
            OwnerId = booking?.OwnerId ?? 0,
            OwnerName = owner?.FullName ?? "Owner",
            VehicleId = booking?.VehicleId ?? 0,
            VehicleName = vehicle is null ? null : $"{vehicle.VehicleType} {vehicle.LicensePlate}".Trim(),
            Participants = await MapParticipantsAsync(room, cancellationToken),
            LastMessage = room.LastMessage is null
                ? null
                : new ChatLastMessageResponse
                {
                    Text = room.LastMessage.Text,
                    SenderId = long.TryParse(room.LastMessage.SenderId, out var senderId) ? senderId : 0,
                    SentAt = room.LastMessage.SentAt
                },
            UnreadCount = unreadCount,
            IsActive = room.IsActive,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };
    }

    private async Task<List<ChatParticipantResponse>> MapParticipantsAsync(ChatRoomDocument room, CancellationToken cancellationToken)
    {
        var participants = new List<ChatParticipantResponse>();
        foreach (var participant in room.Participants)
        {
            var parsedUserId = long.TryParse(participant.UserId, out var userId) ? userId : 0;
            var user = parsedUserId > 0 ? await _userRepository.GetByIdAsync(parsedUserId, cancellationToken) : null;
            participants.Add(new ChatParticipantResponse
            {
                UserId = parsedUserId,
                FullName = user?.FullName ?? participant.Role,
                Role = participant.Role,
                AvatarUrl = user?.AvatarUrl
            });
        }

        return participants;
    }

    private async Task<List<ChatMessageResponse>> MapMessagesAsync(ChatRoomDocument room, IReadOnlyCollection<ChatMessageDocument> messages, CancellationToken cancellationToken)
    {
        var participantNames = new Dictionary<string, string>();
        foreach (var participant in room.Participants)
        {
            var parsedUserId = long.TryParse(participant.UserId, out var userId) ? userId : 0;
            var user = parsedUserId > 0 ? await _userRepository.GetByIdAsync(parsedUserId, cancellationToken) : null;
            participantNames[participant.UserId] = user?.FullName ?? participant.Role;
        }

        var bookingId = long.TryParse(room.BookingId, out var parsedBookingId) ? parsedBookingId : 0;
        return messages
            .OrderBy(message => message.SentAt)
            .Select(message => new ChatMessageResponse
            {
                Id = message.Id ?? string.Empty,
                RoomId = message.RoomId,
                BookingId = bookingId,
                SenderId = long.TryParse(message.SenderId, out var senderId) ? senderId : 0,
                SenderName = participantNames.GetValueOrDefault(message.SenderId, "User"),
                SenderRole = message.SenderRole,
                MessageType = message.MessageType,
                Content = message.Content ?? string.Empty,
                IsRead = message.IsRead,
                SentAt = message.SentAt
            })
            .ToList();
    }

    private async Task NotifyRecipientsAsync(ChatRoomDocument room, long senderId, string content, CancellationToken cancellationToken)
    {
        var senderUser = await _userRepository.GetByIdAsync(senderId, cancellationToken);
        var senderName = senderUser?.FullName ?? "MoveVN user";
        var bookingId = long.TryParse(room.BookingId, out var parsedBookingId) ? parsedBookingId : 0;

        foreach (var recipientId in GetParticipantIds(room).Where(id => id != senderId))
        {
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                UserId = recipientId,
                Type = "Chat",
                Title = $"New message from {senderName}",
                Body = content.Length > 120 ? content[..117] + "..." : content,
                DataJson = JsonSerializer.Serialize(new
                {
                    roomId = room.Id,
                    bookingId,
                    targetPath = $"/chat/booking/{bookingId}",
                    action = "OpenChat"
                }),
                Channel = "InApp"
            }, cancellationToken);
        }
    }

    private static bool IsParticipant(ChatRoomDocument room, long userId)
        => room.Participants.Any(participant => participant.UserId == userId.ToString());

    private static List<long> GetParticipantIds(ChatRoomDocument room)
        => room.Participants
            .Select(participant => long.TryParse(participant.UserId, out var userId) ? userId : 0)
            .Where(userId => userId > 0)
            .Distinct()
            .ToList();
}
