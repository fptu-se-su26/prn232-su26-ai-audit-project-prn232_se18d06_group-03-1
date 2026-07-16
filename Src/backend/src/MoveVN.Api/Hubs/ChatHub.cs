using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MoveVN.Application.Modules.Chats.Interfaces;

namespace MoveVN.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId is null)
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, ChatHubGroups.User(userId.Value));
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string roomId)
    {
        var userId = GetUserId();
        if (userId is null || !await _chatService.CanAccessRoomAsync(roomId, userId.Value, Context.ConnectionAborted))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, ChatHubGroups.Room(roomId));
    }

    public async Task LeaveRoom(string roomId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, ChatHubGroups.Room(roomId));

    private long? GetUserId()
    {
        var rawUserId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return long.TryParse(rawUserId, out var userId) ? userId : null;
    }
}

public static class ChatHubGroups
{
    public static string User(long userId) => $"chat:user:{userId}";
    public static string Room(string roomId) => $"chat:room:{roomId}";
}
