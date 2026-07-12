using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

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

    public void UpdateCustomerProfile(CustomerProfile profile)
    {
        _context.CustomerProfiles.Update(profile);
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

    public async Task AddVerificationRequestAsync(VerificationRequest request, CancellationToken cancellationToken = default)
    {
        await _context.VerificationRequests.AddAsync(request, cancellationToken);
    }

    public void UpdateVerificationRequest(VerificationRequest request)
    {
        _context.VerificationRequests.Update(request);
    }

    public Task<VerificationRequest?> GetVerificationRequestByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<VerificationRequest?> GetLatestNationalIdVerificationByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.VerificationRequests
            .Where(x => x.UserId == userId && x.Type == "NationalId")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(List<AdminUserListItem> Items, int TotalCount)> GetAdminUserListAsync(
        string? keyword, string? sortBy, string? role, string? status, bool? isOnline,
        int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var adminRoleName = UserRoleType.Admin.ToString();
        var query = _context.Users.AsNoTracking();

        query = query.Where(user => !_context.UserRoles
            .Join(_context.Roles,
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new { userRole.UserId, role.Name })
            .Any(row => row.UserId == user.Id && row.Name == adminRoleName));

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLowerInvariant();
            query = query.Where(user =>
                user.FullName.ToLower().Contains(kw)
                || user.Email.ToLower().Contains(kw)
                || (user.Phone != null && user.Phone.Contains(kw)));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleNames = role.Split(',').Select(r => r.Trim()).ToList();
            query = query.Where(user => _context.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .Any(rn => roleNames.Contains(rn)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(user => user.Status == status);
        }

        if (isOnline.HasValue)
        {
            query = query.Where(user => user.IsOnline == isOnline.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = sortBy switch
        {
            "name_asc" => query.OrderBy(user => user.FullName),
            "name_desc" => query.OrderByDescending(user => user.FullName),
            "oldest" => query.OrderBy(user => user.CreatedAt),
            _ => query.OrderByDescending(user => user.CreatedAt)
        };

        query = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var users = await query
            .Select(user => new AdminUserListItem
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                Status = user.Status,
                IsOnline = user.IsOnline,
                LastSeenAt = user.LastSeenAt,
                CreatedAt = user.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var userIds = users.Select(user => user.UserId).ToArray();
        if (userIds.Length != 0)
        {
            var roleRows = await _context.UserRoles
                .AsNoTracking()
                .Where(userRole => userIds.Contains(userRole.UserId))
                .Join(_context.Roles.AsNoTracking(),
                    userRole => userRole.RoleId,
                    role => role.Id,
                    (userRole, role) => new { userRole.UserId, role.Name })
                .ToListAsync(cancellationToken);

            var rolesByUser = roleRows
                .GroupBy(row => row.UserId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(row => row.Name).OrderBy(name => name).ToList());

            foreach (var user in users)
            {
                if (rolesByUser.TryGetValue(user.UserId, out var userRoles))
                {
                    user.Roles = userRoles;
                }
            }
        }

        return (users, totalCount);
    }

    public Task<OwnerApplication?> GetOwnerApplicationByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return _context.OwnerApplications.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<OwnerApplicationCurrentData?> GetOwnerApplicationCurrentDataAsync(long userId, CancellationToken cancellationToken = default)
    {
        var ownerRoleName = UserRoleType.Owner.ToString();

        var query = from app in _context.OwnerApplications
                    where app.UserId == userId
                    orderby app.CreatedAt descending
                    select new OwnerApplicationCurrentData
                    {
                        Id = app.Id,
                        Status = app.Status,
                        BankName = app.BankName,
                        BankAccountNumber = app.BankAccountNumber,
                        BankAccountHolderName = app.BankAccountHolderName,
                        CreatedAt = app.CreatedAt,
                        RejectionReason = app.RejectionReason,
                        UserFullName = _context.Users
                            .Where(u => u.Id == userId)
                            .Select(u => u.FullName)
                            .FirstOrDefault(),
                        CustomerNationalId = _context.CustomerProfiles
                            .Where(cp => cp.UserId == userId)
                            .Select(cp => cp.NationalId)
                            .FirstOrDefault(),
                        CustomerNationalIdVerified = _context.CustomerProfiles
                            .Where(cp => cp.UserId == userId)
                            .Select(cp => cp.NationalIdVerified)
                            .FirstOrDefault(),
                        DriverLicenseVerified = _context.CustomerProfiles
                            .Where(cp => cp.UserId == userId)
                            .Select(cp => cp.DriverLicenseVerified)
                            .FirstOrDefault(),
                        IsOwner = _context.UserRoles
                            .Where(ur => ur.UserId == userId)
                            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                            .Any(name => name == ownerRoleName),
                        Email = _context.Users
                            .Where(u => u.Id == userId)
                            .Select(u => u.Email)
                            .FirstOrDefault(),
                        IsEmailVerified = _context.Users
                            .Where(u => u.Id == userId)
                            .Select(u => u.IsEmailVerified)
                            .FirstOrDefault()
                    };

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<StaffOwnerApplicationQueryResult>> GetOwnerApplicationsByFilterAsync(
        string? status, string? keyword, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
    {
        var query = from app in _context.OwnerApplications
                    join user in _context.Users on app.UserId equals user.Id
                    join cp in _context.CustomerProfiles on app.UserId equals cp.UserId into cpJoin
                    from cp in cpJoin.DefaultIfEmpty()
                    select new
                    {
                        app.Id,
                        app.UserId,
                        user.FullName,
                        user.Email,
                        user.Phone,
                        app.Status,
                        cp.NationalIdVerified,
                        app.BankName,
                        app.BankAccountNumber,
                        app.CreatedAt,
                        app.SubmittedAt
                    };

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLowerInvariant();
            query = query.Where(x => x.FullName.ToLower().Contains(kw)
                || x.Email.ToLower().Contains(kw)
                || (x.Phone != null && x.Phone.Contains(kw)));
        }

        if (fromDate.HasValue)
        {
            query = query.Where(x => x.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(x => x.CreatedAt <= toDate.Value);
        }

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return items.Select(x => new StaffOwnerApplicationQueryResult
        {
            Id = x.Id,
            UserId = x.UserId,
            UserFullName = x.FullName,
            UserEmail = x.Email,
            UserPhone = x.Phone ?? string.Empty,
            Status = x.Status,
            NationalIdVerified = x.NationalIdVerified,
            BankName = x.BankName,
            BankAccountNumber = x.BankAccountNumber,
            CreatedAt = x.CreatedAt,
            SubmittedAt = x.SubmittedAt
        }).ToList();
    }
}
