using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Chats.DTOs;
using MoveVN.Application.Modules.Chats.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/chats")]
public class ChatsController : BaseApiController
{
    private readonly IChatService _chatService;
    private readonly ICurrentUserContext _currentUserContext;

    public ChatsController(IChatService chatService, ICurrentUserContext currentUserContext)
    {
        _chatService = chatService;
        _currentUserContext = currentUserContext;
    }

    [HttpGet("rooms")]
    public async Task<ActionResult<ApiResponse<PagedResult<ChatRoomResponse>>>> GetRooms(
        [FromQuery] ChatRoomListRequest request,
        CancellationToken cancellationToken = default)
        => Success(await _chatService.GetRoomsAsync(GetUserId(), request, cancellationToken));

    [HttpPost("rooms/booking/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<ChatRoomResponse>>> GetOrCreateRoomByBooking(
        long bookingId,
        CancellationToken cancellationToken = default)
        => Success(await _chatService.GetOrCreateRoomByBookingAsync(bookingId, GetUserId(), cancellationToken));

    [HttpGet("rooms/{roomId}")]
    public async Task<ActionResult<ApiResponse<ChatRoomResponse>>> GetRoom(
        string roomId,
        CancellationToken cancellationToken = default)
        => Success(await _chatService.GetRoomByIdAsync(roomId, GetUserId(), cancellationToken));

    [HttpGet("rooms/{roomId}/messages")]
    public async Task<ActionResult<ApiResponse<PagedResult<ChatMessageResponse>>>> GetMessages(
        string roomId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
        => Success(await _chatService.GetMessagesAsync(roomId, GetUserId(), page, pageSize, cancellationToken));

    [HttpPost("rooms/{roomId}/messages")]
    public async Task<ActionResult<ApiResponse<ChatMessageResponse>>> SendMessage(
        string roomId,
        SendChatMessageRequest request,
        CancellationToken cancellationToken = default)
        => Success(await _chatService.SendMessageAsync(roomId, GetUserId(), request, cancellationToken));

    [HttpPut("rooms/{roomId}/read")]
    public async Task<ActionResult<ApiResponse<ChatRoomResponse>>> MarkRoomAsRead(
        string roomId,
        CancellationToken cancellationToken = default)
        => Success(await _chatService.MarkRoomAsReadAsync(roomId, GetUserId(), cancellationToken));

    private long GetUserId()
        => _currentUserContext.UserId ?? throw new AppException(ErrorCode.UNAUTHORIZED);
}
