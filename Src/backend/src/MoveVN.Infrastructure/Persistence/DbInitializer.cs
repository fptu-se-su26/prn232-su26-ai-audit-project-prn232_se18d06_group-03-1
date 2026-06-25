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
        await SeedDriverLicenseClassesAsync(cancellationToken);
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

    private async Task SeedDriverLicenseClassesAsync(CancellationToken cancellationToken)
    {
        var classes = new[]
        {
            new LicenseClassSeed("A1_LEGACY", "A1 cũ", "Xe mô tô 2 bánh đến 175 cm3.", "LegacyBefore2025"),
            new LicenseClassSeed("A2_LEGACY", "A2 cũ", "Xe mô tô 2 bánh trên 175 cm3.", "LegacyBefore2025"),
            new LicenseClassSeed("A3_LEGACY", "A3 cũ", "Xe mô tô 3 bánh.", "LegacyBefore2025"),
            new LicenseClassSeed("A4_LEGACY", "A4 cũ", "Máy kéo có trọng tải đến 1.000 kg.", "LegacyBefore2025"),
            new LicenseClassSeed("B1_AUTO_LEGACY", "B1 số tự động cũ", "Ô tô số tự động đến 9 chỗ, không hành nghề lái xe.", "LegacyBefore2025"),
            new LicenseClassSeed("B1_LEGACY", "B1 cũ", "Ô tô đến 9 chỗ, không hành nghề lái xe.", "LegacyBefore2025"),
            new LicenseClassSeed("B2_LEGACY", "B2 cũ", "Ô tô đến 9 chỗ, hành nghề lái xe.", "LegacyBefore2025"),
            new LicenseClassSeed("C_LEGACY", "C cũ", "Xe tải trên 3.500 kg.", "LegacyBefore2025"),
            new LicenseClassSeed("D_LEGACY", "D cũ", "Xe chở người từ 10 đến 30 chỗ.", "LegacyBefore2025"),
            new LicenseClassSeed("E_LEGACY", "E cũ", "Xe chở người trên 30 chỗ.", "LegacyBefore2025"),
            new LicenseClassSeed("FB2_LEGACY", "FB2 cũ", "Xe hạng B2 kéo rơ-moóc.", "LegacyBefore2025"),
            new LicenseClassSeed("FC_LEGACY", "FC cũ", "Xe hạng C kéo rơ-moóc.", "LegacyBefore2025"),
            new LicenseClassSeed("FD_LEGACY", "FD cũ", "Xe hạng D kéo rơ-moóc.", "LegacyBefore2025"),
            new LicenseClassSeed("FE_LEGACY", "FE cũ", "Xe hạng E kéo rơ-moóc.", "LegacyBefore2025"),

            new LicenseClassSeed("A1", "A1", "Xe mô tô 2 bánh đến 125 cm3 hoặc động cơ điện đến 11 kW.", "Current"),
            new LicenseClassSeed("A", "A", "Xe mô tô trên 125 cm3 hoặc động cơ điện trên 11 kW.", "Current"),
            new LicenseClassSeed("B1", "B1", "Xe mô tô 3 bánh và các loại xe quy định cho hạng A1.", "Current"),
            new LicenseClassSeed("B", "B", "Ô tô đến 8 chỗ, xe tải đến 3.500 kg.", "Current"),
            new LicenseClassSeed("C1", "C1", "Xe tải trên 3.500 kg đến 7.500 kg.", "Current"),
            new LicenseClassSeed("C", "C", "Xe tải trên 7.500 kg.", "Current"),
            new LicenseClassSeed("D1", "D1", "Xe chở người từ 9 đến 16 chỗ.", "Current"),
            new LicenseClassSeed("D2", "D2", "Xe chở người từ 17 đến 29 chỗ.", "Current"),
            new LicenseClassSeed("D", "D", "Xe chở người trên 29 chỗ.", "Current"),
            new LicenseClassSeed("BE", "BE", "Xe hạng B kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("C1E", "C1E", "Xe hạng C1 kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("CE", "CE", "Xe hạng C kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("D1E", "D1E", "Xe hạng D1 kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("D2E", "D2E", "Xe hạng D2 kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("DE", "DE", "Xe hạng D kéo rơ-moóc.", "Current")
        };

        var existingCodes = await _context.DriverLicenseClasses
            .Select(entity => entity.Code)
            .ToListAsync(cancellationToken);
        var existingCodeSet = existingCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var licenseClass in classes)
        {
            if (existingCodeSet.Contains(licenseClass.Code))
            {
                continue;
            }

            await _context.DriverLicenseClasses.AddAsync(new DriverLicenseClass
            {
                Code = licenseClass.Code,
                DisplayName = licenseClass.DisplayName,
                Description = licenseClass.Description,
                SystemVersion = licenseClass.SystemVersion,
                IsActive = true
            }, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var classIdsByCode = await _context.DriverLicenseClasses
            .ToDictionaryAsync(entity => entity.Code, entity => entity.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var compatibilityPairs = BuildDriverLicenseCompatibilityPairs(classes.Select(item => item.Code));
        var existingPairs = await _context.DriverLicenseClassCompatibility
            .Select(entity => new { entity.LicenseClassId, entity.AllowedRequiredLicenseClassId })
            .ToListAsync(cancellationToken);
        var existingPairSet = existingPairs
            .Select(pair => $"{pair.LicenseClassId}:{pair.AllowedRequiredLicenseClassId}")
            .ToHashSet(StringComparer.Ordinal);

        foreach (var (licenseCode, allowedRequiredCode) in compatibilityPairs)
        {
            if (!classIdsByCode.TryGetValue(licenseCode, out var licenseClassId)
                || !classIdsByCode.TryGetValue(allowedRequiredCode, out var allowedRequiredLicenseClassId))
            {
                continue;
            }

            var key = $"{licenseClassId}:{allowedRequiredLicenseClassId}";
            if (existingPairSet.Contains(key))
            {
                continue;
            }

            await _context.DriverLicenseClassCompatibility.AddAsync(new DriverLicenseClassCompatibility
            {
                LicenseClassId = licenseClassId,
                AllowedRequiredLicenseClassId = allowedRequiredLicenseClassId
            }, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static HashSet<(string LicenseCode, string AllowedRequiredCode)> BuildDriverLicenseCompatibilityPairs(IEnumerable<string> licenseCodes)
    {
        var pairs = licenseCodes
            .Select(code => (LicenseCode: code, AllowedRequiredCode: code))
            .ToHashSet();

        AddAllowed(pairs, "A1_LEGACY", "A1");
        AddAllowed(pairs, "A2_LEGACY", "A1_LEGACY", "A1", "A2_LEGACY");
        AddAllowed(pairs, "A3_LEGACY", "A3_LEGACY", "B1");
        AddAllowed(pairs, "B1_AUTO_LEGACY", "B1_AUTO_LEGACY");
        AddAllowed(pairs, "B1_LEGACY", "B1_AUTO_LEGACY", "B1_LEGACY", "B");
        AddAllowed(pairs, "B2_LEGACY", "B1_AUTO_LEGACY", "B1_LEGACY", "B2_LEGACY", "B");
        AddAllowed(pairs, "C_LEGACY", "B", "C1", "C_LEGACY", "C");
        AddAllowed(pairs, "D_LEGACY", "B", "D1", "D2", "D_LEGACY", "D");
        AddAllowed(pairs, "E_LEGACY", "B", "D1", "D2", "D", "E_LEGACY");
        AddAllowed(pairs, "FB2_LEGACY", "B", "B2_LEGACY", "FB2_LEGACY", "BE");
        AddAllowed(pairs, "FC_LEGACY", "B", "C1", "C", "C_LEGACY", "FC_LEGACY", "C1E", "CE");
        AddAllowed(pairs, "FD_LEGACY", "B", "D1", "D2", "D", "D_LEGACY", "FD_LEGACY", "D1E", "D2E", "DE");
        AddAllowed(pairs, "FE_LEGACY", "B", "D1", "D2", "D", "E_LEGACY", "FE_LEGACY", "D1E", "D2E", "DE");

        AddAllowed(pairs, "A", "A1");
        AddAllowed(pairs, "B1", "A1");
        AddAllowed(pairs, "B", "B1");
        AddAllowed(pairs, "C1", "B");
        AddAllowed(pairs, "C", "B", "C1");
        AddAllowed(pairs, "D1", "B");
        AddAllowed(pairs, "D2", "B", "D1");
        AddAllowed(pairs, "D", "B", "D1", "D2");
        AddAllowed(pairs, "BE", "B");
        AddAllowed(pairs, "C1E", "B", "C1", "BE");
        AddAllowed(pairs, "CE", "B", "C1", "C", "BE", "C1E");
        AddAllowed(pairs, "D1E", "B", "D1", "BE");
        AddAllowed(pairs, "D2E", "B", "D1", "D2", "BE", "D1E");
        AddAllowed(pairs, "DE", "B", "D1", "D2", "D", "BE", "D1E", "D2E");

        return pairs;
    }

    private static void AddAllowed(HashSet<(string LicenseCode, string AllowedRequiredCode)> pairs, string licenseCode, params string[] allowedRequiredCodes)
    {
        foreach (var allowedRequiredCode in allowedRequiredCodes)
        {
            pairs.Add((licenseCode, allowedRequiredCode));
        }
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

    private sealed record LicenseClassSeed(string Code, string DisplayName, string Description, string SystemVersion);
}
