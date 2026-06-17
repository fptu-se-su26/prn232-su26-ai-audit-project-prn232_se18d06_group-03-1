using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Identity;

namespace MoveVN.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var sp = scope.ServiceProvider;

        var db = sp.GetRequiredService<AppDbContext>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = sp.GetRequiredService<RoleManager<ApplicationRole>>();

        var roleNames = new[] { "Guest", "Customer", "Owner", "Staff", "Admin" };
        var permissionCodes = new[]
        {
            ("staff.verify", "Staff can review customer verification requests"),
            ("staff.inspect", "Staff can perform vehicle inspections"),
            ("staff.dispute", "Staff can process disputes"),
            ("admin.dashboard", "Admin can view analytics dashboard")
        };

        // Domain roles — check by name to avoid duplicate key on unique IX_Roles_name
        var anyDomainRoles = await db.Roles.AnyAsync();
        if (!anyDomainRoles)
        {
            for (int i = 0; i < roleNames.Length; i++)
            {
                db.Roles.Add(new Role { Id = i + 1, Name = roleNames[i], Description = roleNames[i] });
            }
            await db.SaveChangesAsync();
        }

        // Identity roles
        for (int i = 0; i < roleNames.Length; i++)
        {
            var exists = await roleManager.RoleExistsAsync(roleNames[i]);
            if (!exists)
            {
                var appRole = new ApplicationRole
                {
                    Id = Guid.NewGuid(),
                    Name = roleNames[i],
                    NormalizedName = roleNames[i].ToUpperInvariant()
                };
                var result = await roleManager.CreateAsync(appRole);
                if (!result.Succeeded)
                    throw new InvalidOperationException($"Failed to create role {roleNames[i]}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        if (!await db.Permissions.AnyAsync())
        {
            var nextId = 1;
            foreach (var (code, description) in permissionCodes)
            {
                db.Permissions.Add(new Permission
                {
                    Id = nextId++,
                    Code = code,
                    Description = description
                });
            }

            await db.SaveChangesAsync();
        }

        var permissions = await db.Permissions.ToListAsync();
        var staffRole = await db.Roles.FirstAsync(r => r.Name == "Staff");
        var adminRole = await db.Roles.FirstAsync(r => r.Name == "Admin");

        foreach (var permission in permissions)
        {
            if (!await db.RolePermissions.AnyAsync(x => x.RoleId == adminRole.Id && x.PermissionId == permission.Id))
                db.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = permission.Id });
        }

        var staffDefaults = new[] { "staff.verify", "staff.inspect", "staff.dispute" };
        foreach (var code in staffDefaults)
        {
            var permission = permissions.FirstOrDefault(x => x.Code == code);
            if (permission is not null &&
                !await db.RolePermissions.AnyAsync(x => x.RoleId == staffRole.Id && x.PermissionId == permission.Id))
            {
                db.RolePermissions.Add(new RolePermission { RoleId = staffRole.Id, PermissionId = permission.Id });
            }
        }
        await db.SaveChangesAsync();

        var seedUsers = new (string Email, string Password, string FullName, int RoleId)[]
        {
            ("guest@movevn.com", "Guest@123", "Guest User", 1),
            ("customer@movevn.com", "Customer@123", "Customer User", 2),
            ("owner@movevn.com", "Owner@123", "Owner User", 3),
            ("staff@movevn.com", "Staff@123", "Staff User", 4),
            ("admin@movevn.com", "Admin@123", "Admin User", 5),
        };

        foreach (var (email, password, fullName, roleId) in seedUsers)
        {
            // Update or create domain user
            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existingUser is not null)
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                db.Users.Update(existingUser);
                await db.SaveChangesAsync();
            }
            else
            {
                var user = new User
                {
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    FullName = fullName,
                    Status = "Active",
                    IsEmailVerified = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId });
                await db.SaveChangesAsync();
            }

            // Create identity user if not exists
            var appUser = await userManager.FindByEmailAsync(email);
            if (appUser is null)
            {
                appUser = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow,
                };
                var createResult = await userManager.CreateAsync(appUser, password);
                if (!createResult.Succeeded)
                    throw new InvalidOperationException($"Failed to create user {email}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }
            else
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(appUser);
                var resetResult = await userManager.ResetPasswordAsync(appUser, token, password);
                if (!resetResult.Succeeded)
                    throw new InvalidOperationException($"Failed to reset password for {email}");
            }

            // Add to role
            if (!await userManager.IsInRoleAsync(appUser, roleNames[roleId - 1]))
            {
                await userManager.AddToRoleAsync(appUser, roleNames[roleId - 1]);
            }
        }

        // Vehicle brands & models
        if (!await db.VehicleBrands.AnyAsync())
        {
            db.VehicleBrands.AddRange(
                new VehicleBrand { Id = 1, Name = "Toyota", VehicleType = "Car", IsActive = true },
                new VehicleBrand { Id = 2, Name = "Honda", VehicleType = "Motorbike", IsActive = true }
            );
            db.VehicleModels.AddRange(
                new VehicleModel { Id = 1, BrandId = 1, Name = "Toyota Vios 2023", IsActive = true },
                new VehicleModel { Id = 2, BrandId = 2, Name = "Honda SH 2023", IsActive = true }
            );
        }

        // Vehicle
        if (!await db.Vehicles.AnyAsync())
        {
            var owner = await db.Users.FirstOrDefaultAsync(u => u.Email == "owner@movevn.com");
            if (owner is not null)
            {
                db.Vehicles.Add(new Vehicle
                {
                    OwnerId = owner.Id,
                    BrandId = 1,
                    ModelId = 1,
                    Year = 2023,
                    LicensePlate = "51A-12345",
                    Description = "Toyota Vios 2023 in excellent condition",
                    Address = "Ho Chi Minh City",
                    PricePerDay = 800000,
                    Status = "Available",
                    CreatedAt = DateTime.UtcNow,
                });
            }
        }

        // System config
        var configs = new List<SystemConfig>
        {
            new() { ConfigKey = "platform_fee_pct", ConfigValue = "10", DataType = "int", Description = "Platform fee percentage" },
            new() { ConfigKey = "deposit_rate_pct", ConfigValue = "30", DataType = "int", Description = "Deposit rate percentage" },
            new() { ConfigKey = "auto_cancel_hours", ConfigValue = "24", DataType = "int", Description = "Auto-cancel unconfirmed bookings after hours" },
            new() { ConfigKey = "risk_threshold", ConfigValue = "50", DataType = "int", Description = "Risk score threshold for flagging" },
        };
        foreach (var cfg in configs)
        {
            if (!await db.SystemConfigs.AnyAsync(c => c.ConfigKey == cfg.ConfigKey))
                db.SystemConfigs.Add(cfg);
        }

        await db.SaveChangesAsync();
    }
}
