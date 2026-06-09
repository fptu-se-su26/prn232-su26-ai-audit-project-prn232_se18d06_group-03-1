using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IOtpService
{
    Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default);
    Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default);
}
