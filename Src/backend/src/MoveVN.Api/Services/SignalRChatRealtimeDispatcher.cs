using Microsoft.AspNetCore.SignalR;
using MoveVN.Api.Hubs;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Chats.DTOs;

namespace MoveVN.Api.Services;

public class SignalRChatRealtimeDispatcher : IChatRealtimeDispatcher
{
    private readonly IHubContext<ChatHub> _hubContext;

    public SignalRChatRealtimeDispatcher(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendMessageCreatedAsync(
        string roomId,
        IEnumerable<long> participantUserIds,
        ChatMessageCreatedPayload payload,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group(ChatHubGroups.Room(roomId))
            .SendAsync("chat.messageCreated", payload, cancellationToken);

        foreach (var userId in participantUserIds.Distinct())
        {
            await _hubContext.Clients
                .Group(ChatHubGroups.User(userId))
                .SendAsync("chat.messageCreated", payload, cancellationToken);
        }
    }

    public async Task SendRoomUpdatedAsync(
        string roomId,
        IEnumerable<long> participantUserIds,
        ChatRoomResponse room,
        CancellationToken cancellationToken = default)
    {
        foreach (var userId in participantUserIds.Distinct())
        {
            await _hubContext.Clients
                .Group(ChatHubGroups.User(userId))
                .SendAsync("chat.roomUpdated", room, cancellationToken);
        }
    }
}
