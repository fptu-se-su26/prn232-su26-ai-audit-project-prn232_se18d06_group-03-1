using MoveVN.Application.Modules.Chats.DTOs;

namespace MoveVN.Application.Common.Interfaces;

public interface IChatRealtimeDispatcher
{
    Task SendMessageCreatedAsync(string roomId, IEnumerable<long> participantUserIds, ChatMessageCreatedPayload payload, CancellationToken cancellationToken = default);
    Task SendRoomUpdatedAsync(string roomId, IEnumerable<long> participantUserIds, ChatRoomResponse room, CancellationToken cancellationToken = default);
}
