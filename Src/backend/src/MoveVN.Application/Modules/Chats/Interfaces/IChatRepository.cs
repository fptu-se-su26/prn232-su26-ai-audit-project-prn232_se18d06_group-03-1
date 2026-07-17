using MoveVN.Domain.Documents;

namespace MoveVN.Application.Modules.Chats.Interfaces;

public interface IChatRepository
{
    Task<ChatRoomDocument?> GetRoomByIdAsync(string roomId, CancellationToken cancellationToken = default);
    Task<ChatRoomDocument?> GetRoomByBookingIdAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<List<ChatRoomDocument>> GetRoomsByUserIdAsync(long userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountRoomsByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task AddRoomAsync(ChatRoomDocument room, CancellationToken cancellationToken = default);
    Task ReplaceRoomAsync(ChatRoomDocument room, CancellationToken cancellationToken = default);
    Task AddMessageAsync(ChatMessageDocument message, CancellationToken cancellationToken = default);
    Task<List<ChatMessageDocument>> GetMessagesAsync(string roomId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountMessagesAsync(string roomId, CancellationToken cancellationToken = default);
    Task MarkMessagesReadAsync(string roomId, long readerUserId, CancellationToken cancellationToken = default);
}
