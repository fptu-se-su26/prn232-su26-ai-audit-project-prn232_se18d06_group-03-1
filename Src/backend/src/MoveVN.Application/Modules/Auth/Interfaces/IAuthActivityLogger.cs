using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IAuthActivityLogger
{
    Task LogAsync(long? userId, string? email, AuthEventType eventType, string? ipAddress, string? userAgent, object? metadata = null, CancellationToken cancellationToken = default);
}
