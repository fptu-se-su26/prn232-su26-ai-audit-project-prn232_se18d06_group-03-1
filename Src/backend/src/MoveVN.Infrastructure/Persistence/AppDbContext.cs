using MoveVN.Domain.Common;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Linq.Expressions;

namespace MoveVN.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // ─── Domain tables ───────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<CustomerProfile> CustomerProfiles => Set<CustomerProfile>();
    public DbSet<OwnerProfile> OwnerProfiles => Set<OwnerProfile>();
    public DbSet<StaffProfile> StaffProfiles => Set<StaffProfile>();
    public DbSet<StaffPermission> StaffPermissions => Set<StaffPermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<AuthLog> AuthLogs => Set<AuthLog>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<TrustScore> TrustScores => Set<TrustScore>();
    public DbSet<TrustScoreHistory> TrustScoreHistories => Set<TrustScoreHistory>();
    public DbSet<VerificationRequest> VerificationRequests => Set<VerificationRequest>();

    // ─── Vehicle tables ───────────────────────────────────────────────────────
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleBrand> VehicleBrands => Set<VehicleBrand>();
    public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
    public DbSet<VehicleImage> VehicleImages => Set<VehicleImage>();
    public DbSet<VehicleDocument> VehicleDocuments => Set<VehicleDocument>();
    public DbSet<VehicleFeature> VehicleFeatures => Set<VehicleFeature>();
    public DbSet<VehicleFeatureMapping> VehicleFeatureMappings => Set<VehicleFeatureMapping>();
    public DbSet<VehiclePricing> VehiclePricings => Set<VehiclePricing>();
    public DbSet<VehicleModelPricing> VehicleModelPricings => Set<VehicleModelPricing>();
    public DbSet<BlockedDate> BlockedDates => Set<BlockedDate>();
    public DbSet<CarDetail> CarDetails => Set<CarDetail>();
    public DbSet<MotorbikeDetail> MotorbikeDetails => Set<MotorbikeDetail>();
    public DbSet<PricingRegion> PricingRegions => Set<PricingRegion>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<PricingRule> PricingRules => Set<PricingRule>();

    // ─── Booking tables ───────────────────────────────────────────────────────
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingStatusHistory> BookingStatusHistories => Set<BookingStatusHistory>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<InspectionReport> InspectionReports => Set<InspectionReport>();
    public DbSet<CheckInOutImage> CheckInOutImages => Set<CheckInOutImage>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeEvidence> DisputeEvidences => Set<DisputeEvidence>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Review> Reviews => Set<Review>();

    // ─── Notification & Support ───────────────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();

    // ─── Financial ───────────────────────────────────────────────────────────
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<PlatformFeeRule> PlatformFeeRules => Set<PlatformFeeRule>();
    public DbSet<CashbackRule> CashbackRules => Set<CashbackRule>();

    // ─── System ───────────────────────────────────────────────────────────────
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();
    public DbSet<MLPredictionLog> MLPredictionLogs => Set<MLPredictionLog>();
    public DbSet<DemandForecast> DemandForecasts => Set<DemandForecast>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Composite keys
        builder.Entity<VehicleFeatureMapping>().HasKey(x => new { x.VehicleId, x.FeatureId });
        builder.Entity<RolePermission>().HasKey(x => new { x.RoleId, x.PermissionId });
        builder.Entity<StaffPermission>().HasKey(x => new { x.UserId, x.PermissionCode });

        // CarDetail / MotorbikeDetail use VehicleId as PK
        builder.Entity<CarDetail>().HasKey(x => x.VehicleId);
        builder.Entity<MotorbikeDetail>().HasKey(x => x.VehicleId);

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType).Property(nameof(BaseEntity.Id)).ValueGeneratedNever();
                builder.Entity(entityType.ClrType).HasQueryFilter(CreateSoftDeleteFilter(entityType.ClrType));
            }
        }

        // Fix snake_case table names back to PascalCase, matching the DB schema from the initial migration
        var singularTables = new HashSet<string>
        {
            "Area", "CarDetail", "MotorbikeDetail", "VehicleBrand", "VehicleFeature",
            "VehicleModel", "VehicleModelPricing", "VehiclePricing", "SystemConfig",
            "VehicleFeatureMapping", "VehicleFeatureMapping",
        };
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            var tableName = entityType.GetTableName();
            if (tableName is null) continue;
            var pascalName = SnakeToPascal(tableName);
            // If the entity type name is singular but SnakeToPascal gives plural, override
            var clrName = entityType.ClrType.Name;
            if (singularTables.Contains(clrName))
            {
                entityType.SetTableName(clrName);
            }
            else
            {
                entityType.SetTableName(pascalName);
            }
        }
    }

    private static string SnakeToPascal(string name)
    {
        return string.Concat(name.Split('_', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => char.ToUpper(p[0]) + p[1..]));
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInformation();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditInformation()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.Id = entry.Entity.Id == Guid.Empty ? Guid.NewGuid() : entry.Entity.Id;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    private static LambdaExpression CreateSoftDeleteFilter(Type entityType)
    {
        var parameter = Expression.Parameter(entityType, "e");
        var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
        var condition = Expression.Equal(property, Expression.Constant(false));
        return Expression.Lambda(condition, parameter);
    }
}
