using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface ILoginSessionService
{
    Task<IReadOnlyList<LoginSessionResponse>> GetAsync(long userId, CancellationToken cancellationToken = default);
    Task RevokeAsync(long userId, string sessionId, CancellationToken cancellationToken = default);
    Task RevokeOthersAsync(long userId, string currentSessionId, CancellationToken cancellationToken = default);
}
