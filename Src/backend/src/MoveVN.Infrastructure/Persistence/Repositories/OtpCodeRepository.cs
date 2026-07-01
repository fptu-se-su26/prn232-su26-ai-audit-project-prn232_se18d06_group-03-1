using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class OtpCodeRepository : IOtpCodeRepository
{
    private readonly AppDbContext _context;

    public OtpCodeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(OtpCode otpCode, CancellationToken cancellationToken = default)
    {
        await _context.OtpCodes.AddAsync(otpCode, cancellationToken);
    }

    public Task<OtpCode?> GetLatestAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var purposeValue = purpose.ToString();

        return _context.OtpCodes
            .Where(x => x.Email.ToLower() == normalizedEmail && x.Purpose == purposeValue)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public void Update(OtpCode otpCode)
    {
        _context.OtpCodes.Update(otpCode);
    }
}
