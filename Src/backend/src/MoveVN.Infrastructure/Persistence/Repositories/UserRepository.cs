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

    public Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.CustomerProfiles.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
    }

    public Task<OwnerProfile?> GetOwnerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.OwnerProfiles.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
    }

    public void UpdateOwnerProfile(OwnerProfile profile)
    {
        _context.OwnerProfiles.Update(profile);
    }

    public async Task AddOwnerApplicationAsync(OwnerApplication application, CancellationToken cancellationToken = default)
    {
        await _context.OwnerApplications.AddAsync(application, cancellationToken);
    }

    public Task<OwnerApplication?> GetLatestOwnerApplicationByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.OwnerApplications
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> HasActiveOwnerApplicationAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.OwnerApplications
            .AnyAsync(x => x.UserId == userId
                && x.Status != "Approved"
                && x.Status != "Rejected"
                && x.Status != "Cancelled", cancellationToken);
    }

    public void UpdateOwnerApplication(OwnerApplication application)
    {
        _context.OwnerApplications.Update(application);
    }
}
