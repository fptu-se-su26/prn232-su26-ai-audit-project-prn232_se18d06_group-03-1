using MongoDB.Driver;
using MoveVN.Application.Modules.Chats.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Persistence.Repositories.Chats;

public class ChatRepository : IChatRepository
{
    private readonly MongoDbContext _context;
    private static readonly SortDefinition<ChatRoomDocument> CanonicalRoomSort =
        Builders<ChatRoomDocument>.Sort
            .Descending("LastMessage.SentAt")
            .Descending(room => room.UpdatedAt)
            .Descending(room => room.CreatedAt);

    public ChatRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<ChatRoomDocument?> GetRoomByIdAsync(string roomId, CancellationToken cancellationToken = default)
        => await _context.ChatRooms
            .Find(room => room.Id == roomId && room.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<ChatRoomDocument?> GetRoomByBookingIdAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.ChatRooms
            .Find(room => room.BookingId == bookingId.ToString() && room.IsActive)
            .Sort(CanonicalRoomSort)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<List<ChatRoomDocument>> GetRoomsByBookingIdAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.ChatRooms
            .Find(room => room.BookingId == bookingId.ToString() && room.IsActive)
            .Sort(CanonicalRoomSort)
            .ToListAsync(cancellationToken);

    public async Task<List<ChatRoomDocument>> GetRoomsByUserIdAsync(long userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var filter = BuildUserRoomFilter(userId);
        return await _context.ChatRooms
            .Find(filter)
            .Sort(CanonicalRoomSort)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatRoomDocument>> GetAllRoomsByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var filter = BuildUserRoomFilter(userId);
        return await _context.ChatRooms
            .Find(filter)
            .Sort(CanonicalRoomSort)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountRoomsByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var filter = BuildUserRoomFilter(userId);
        var bookingIds = await _context.ChatRooms
            .Find(filter)
            .Project(room => room.BookingId)
            .ToListAsync(cancellationToken);

        return bookingIds.Distinct(StringComparer.Ordinal).Count();
    }

    public async Task<ChatRoomDocument> GetOrCreateRoomAsync(
        ChatRoomDocument room,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<ChatRoomDocument>.Filter.And(
            Builders<ChatRoomDocument>.Filter.Eq(existing => existing.BookingId, room.BookingId),
            Builders<ChatRoomDocument>.Filter.Eq(existing => existing.IsActive, true));
        var update = Builders<ChatRoomDocument>.Update
            .SetOnInsert(existing => existing.BookingId, room.BookingId)
            .SetOnInsert(existing => existing.RoomType, room.RoomType)
            .SetOnInsert(existing => existing.Participants, room.Participants)
            .SetOnInsert(existing => existing.LastMessage, room.LastMessage)
            .SetOnInsert(existing => existing.UnreadCount, room.UnreadCount)
            .SetOnInsert(existing => existing.IsActive, true)
            .SetOnInsert(existing => existing.CreatedAt, room.CreatedAt)
            .SetOnInsert(existing => existing.UpdatedAt, room.UpdatedAt);

        return await _context.ChatRooms.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<ChatRoomDocument>
            {
                IsUpsert = true,
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task AddRoomAsync(ChatRoomDocument room, CancellationToken cancellationToken = default)
        => await _context.ChatRooms.InsertOneAsync(room, cancellationToken: cancellationToken);

    public async Task ReplaceRoomAsync(ChatRoomDocument room, CancellationToken cancellationToken = default)
        => await _context.ChatRooms.ReplaceOneAsync(
            existing => existing.Id == room.Id,
            room,
            cancellationToken: cancellationToken);

    public async Task AddMessageAsync(ChatMessageDocument message, CancellationToken cancellationToken = default)
        => await _context.ChatMessages.InsertOneAsync(message, cancellationToken: cancellationToken);

    public async Task<List<ChatMessageDocument>> GetMessagesAsync(string roomId, int page, int pageSize, CancellationToken cancellationToken = default)
        => await _context.ChatMessages
            .Find(message => message.RoomId == roomId && !message.IsDeleted)
            .SortByDescending(message => message.SentAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

    public async Task<int> CountMessagesAsync(string roomId, CancellationToken cancellationToken = default)
        => (int)await _context.ChatMessages.CountDocumentsAsync(
            message => message.RoomId == roomId && !message.IsDeleted,
            cancellationToken: cancellationToken);

    public async Task MarkMessagesReadAsync(string roomId, long readerUserId, CancellationToken cancellationToken = default)
    {
        var reader = readerUserId.ToString();
        var builder = Builders<ChatMessageDocument>.Filter;
        var filter = builder.And(
            builder.Eq(message => message.RoomId, roomId),
            builder.Ne(message => message.SenderId, reader),
            builder.Eq(message => message.IsDeleted, false),
            builder.Not(builder.ElemMatch(message => message.ReadBy, receipt => receipt.UserId == reader)));

        var update = Builders<ChatMessageDocument>.Update
            .Set(message => message.IsRead, true)
            .Push(message => message.ReadBy, new MessageReadReceiptDocument
            {
                UserId = reader,
                ReadAt = DateTime.UtcNow
            });

        await _context.ChatMessages.UpdateManyAsync(filter, update, cancellationToken: cancellationToken);
    }

    private static FilterDefinition<ChatRoomDocument> BuildUserRoomFilter(long userId)
    {
        var builder = Builders<ChatRoomDocument>.Filter;
        return builder.And(
            builder.Eq(room => room.IsActive, true),
            builder.ElemMatch(room => room.Participants, participant => participant.UserId == userId.ToString()));
    }
}
