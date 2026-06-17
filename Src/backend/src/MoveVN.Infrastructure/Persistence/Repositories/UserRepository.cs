using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return _context.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return _context.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail, cancellationToken);
    }

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return _context.Users.AnyAsync(x => x.Email.ToLower() == normalizedEmail, cancellationToken);
    }

    public Task<bool> ExistsByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var trimmedPhone = phone.Trim();
        return _context.Users.AnyAsync(x => x.Phone == trimmedPhone, cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
    }

    public async Task AddCustomerProfileAsync(CustomerProfile profile, CancellationToken cancellationToken = default)
    {
        await _context.CustomerProfiles.AddAsync(profile, cancellationToken);
    }

    public async Task AddOwnerProfileAsync(OwnerProfile profile, CancellationToken cancellationToken = default)
    {
        await _context.OwnerProfiles.AddAsync(profile, cancellationToken);
    }

    public async Task AddStaffProfileAsync(StaffProfile profile, CancellationToken cancellationToken = default)
    {
        await _context.StaffProfiles.AddAsync(profile, cancellationToken);
    }

    public void Update(User user)
    {
        _context.Users.Update(user);
    }
}
