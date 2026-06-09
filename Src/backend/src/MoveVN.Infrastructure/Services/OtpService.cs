using System.Security.Cryptography;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly IOtpCodeRepository _otpCodeRepository;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IEmailSender _emailSender;

    public OtpService(
        IOtpCodeRepository otpCodeRepository,
        IPasswordHasherService passwordHasherService,
        IEmailSender emailSender)
    {
        _otpCodeRepository = otpCodeRepository;
        _passwordHasherService = passwordHasherService;
        _emailSender = emailSender;
    }

    public async Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

        await _otpCodeRepository.AddAsync(new OtpCode
        {
            UserId = userId,
            Email = email.Trim().ToLowerInvariant(),
            OtpCodeHash = _passwordHasherService.Hash(otp),
            Purpose = purpose.ToString(),
            IpAddress = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _emailSender.SendOtpAsync(email, otp, purpose.ToString(), cancellationToken);
    }

    public async Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default)
    {
        var otpCode = await _otpCodeRepository.GetLatestAsync(email, purpose, cancellationToken)
            ?? throw new AppException(ErrorCode.OTP_FAIL);

        if (otpCode.IsUsed)
        {
            throw new AppException(ErrorCode.OTP_ALREADY_USED);
        }

        if (otpCode.ExpiresAt <= DateTime.UtcNow || !_passwordHasherService.Verify(otpCode.OtpCodeHash, otp))
        {
            otpCode.Attempts++;
            _otpCodeRepository.Update(otpCode);
            throw new AppException(ErrorCode.OTP_FAIL);
        }

        otpCode.IsUsed = true;
        otpCode.UsedAt = DateTime.UtcNow;
        _otpCodeRepository.Update(otpCode);
    }
}
