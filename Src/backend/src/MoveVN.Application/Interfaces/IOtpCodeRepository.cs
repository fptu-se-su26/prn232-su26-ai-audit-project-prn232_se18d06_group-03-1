using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Interfaces;

public interface IOtpCodeRepository
{
    Task AddAsync(OtpCode otpCode, CancellationToken cancellationToken = default);
    Task<OtpCode?> GetLatestAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);
    void Update(OtpCode otpCode);
}
