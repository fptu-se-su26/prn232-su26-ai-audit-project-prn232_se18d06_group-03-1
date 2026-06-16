using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly MongoDbContext _mongo;

    public ChatHub(MongoDbContext mongo)
    {
        _mongo = mongo;
    }

    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim is null)
        {
            await base.OnConnectedAsync();
            return;
        }

        var rooms = await _mongo.ChatRooms
            .Find(r => r.Participants.Any(p => p.UserId == userIdClaim.Value))
            .ToListAsync();

        foreach (var room in rooms)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, room.Id!);
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);
    }

    public async Task SendMessage(string conversationId, string message)
    {
        var senderId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        await Clients.Group(conversationId).SendAsync("ReceiveMessage", new
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = message,
            SentAt = DateTime.UtcNow
        });
    }

    public async Task MarkAsRead(string conversationId)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        await Clients.Group(conversationId).SendAsync("MessageRead", new
        {
            ConversationId = conversationId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        });
    }
}
