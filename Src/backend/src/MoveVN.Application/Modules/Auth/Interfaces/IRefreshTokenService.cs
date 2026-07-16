using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IRefreshTokenService
{
    Task<(string PlainToken, RefreshToken Entity)> CreateAsync(long userId, string? deviceInfo, string sessionId, string? ipAddress, CancellationToken cancellationToken = default);
    Task<RefreshToken> ValidateAsync(string plainToken, CancellationToken cancellationToken = default);
    Task RevokeAsync(string plainToken, CancellationToken cancellationToken = default);
}
