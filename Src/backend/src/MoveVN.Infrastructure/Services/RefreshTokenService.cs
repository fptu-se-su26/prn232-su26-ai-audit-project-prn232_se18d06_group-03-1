using System.Security.Cryptography;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly ITokenSessionService _tokenSessionService;

    public RefreshTokenService(IRefreshTokenRepository refreshTokenRepository, IPasswordHasherService passwordHasherService, ITokenSessionService tokenSessionService)
    {
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasherService = passwordHasherService;
        _tokenSessionService = tokenSessionService;
    }

    public async Task<(string PlainToken, RefreshToken Entity)> CreateAsync(long userId, string? deviceInfo, string sessionId, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var plainToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = _passwordHasherService.Sha256(plainToken),
            DeviceInfo = deviceInfo,
            SessionId = sessionId,
            IpAddress = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepository.AddAsync(entity, cancellationToken);
        return (plainToken, entity);
    }

    public async Task<RefreshToken> ValidateAsync(string plainToken, CancellationToken cancellationToken = default)
    {
        var tokenHash = _passwordHasherService.Sha256(plainToken);
        var refreshToken = await _refreshTokenRepository.GetByHashAsync(tokenHash, cancellationToken)
            ?? throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);

        if (refreshToken.RevokedAt is not null)
        {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        if (refreshToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        return refreshToken;
    }

    public async Task RevokeAsync(string plainToken, CancellationToken cancellationToken = default)
    {
        var refreshToken = await ValidateAsync(plainToken, cancellationToken);
        refreshToken.RevokedAt = DateTime.UtcNow;
        _refreshTokenRepository.Update(refreshToken);
    }

    public async Task RevokeAllByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var tokens = await _refreshTokenRepository.GetActiveByUserIdAsync(userId, cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = now;
            _refreshTokenRepository.Update(token);

            if (!string.IsNullOrWhiteSpace(token.AccessTokenJti))
            {
                await _tokenSessionService.RevokeAsync(token.AccessTokenJti, cancellationToken);
            }
        }
    }
}
