using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Chats.DTOs;

namespace MoveVN.Application.Modules.Chats.Interfaces;

public interface IChatService
{
    Task<PagedResult<ChatRoomResponse>> GetRoomsAsync(long userId, ChatRoomListRequest request, CancellationToken cancellationToken = default);
    Task<ChatRoomResponse> GetOrCreateRoomByBookingAsync(long bookingId, long userId, CancellationToken cancellationToken = default);
    Task<ChatRoomResponse> GetRoomByIdAsync(string roomId, long userId, CancellationToken cancellationToken = default);
    Task<bool> CanAccessRoomAsync(string roomId, long userId, CancellationToken cancellationToken = default);
    Task<PagedResult<ChatMessageResponse>> GetMessagesAsync(string roomId, long userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<ChatMessageResponse> SendMessageAsync(string roomId, long senderId, SendChatMessageRequest request, CancellationToken cancellationToken = default);
    Task<ChatRoomResponse> MarkRoomAsReadAsync(string roomId, long readerUserId, CancellationToken cancellationToken = default);
}
