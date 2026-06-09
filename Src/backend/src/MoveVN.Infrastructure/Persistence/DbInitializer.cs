using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MoveVN.Infrastructure.Persistence;

public class DbInitializer
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasherService _passwordHasherService;

    public DbInitializer(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasherService passwordHasherService)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasherService = passwordHasherService;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedRolesAsync(cancellationToken);
        await SeedAdminAsync(cancellationToken);
    }

    private async Task SeedRolesAsync(CancellationToken cancellationToken)
    {
        foreach (var roleType in Enum.GetValues<UserRoleType>())
        {
            var roleName = roleType.ToString();
            if (!await _context.Roles.AnyAsync(x => x.Name == roleName, cancellationToken))
            {
                await _context.Roles.AddAsync(new Role
                {
                    Name = roleName,
                    Description = $"{roleName} role"
                }, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedAdminAsync(CancellationToken cancellationToken)
    {
        var email = _configuration["ADMIN_EMAIL"];
        var password = _configuration["ADMIN_PASSWORD"];
        var fullName = _configuration["ADMIN_FULL_NAME"] ?? "System Admin";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(x => x.Email == normalizedEmail, cancellationToken))
        {
            return;
        }

        var adminRole = await _context.Roles.FirstOrDefaultAsync(x => x.Name == UserRoleType.Admin.ToString(), cancellationToken)
            ?? throw new AppException(ErrorCode.ADMIN_SEED_FAILED);

        var admin = new User
        {
            Email = normalizedEmail,
            FullName = fullName,
            PasswordHash = _passwordHasherService.Hash(password),
            Status = UserStatus.Active.ToString(),
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(admin, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _context.UserRoles.AddAsync(new UserRole
        {
            UserId = admin.Id,
            RoleId = adminRole.Id,
            AssignedAt = DateTime.UtcNow
        }, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
