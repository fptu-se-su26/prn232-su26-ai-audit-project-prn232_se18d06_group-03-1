using MoveVN.Domain.Common;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Text;

namespace MoveVN.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Area> Area => Set<Area>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<BlockedDate> BlockedDates => Set<BlockedDate>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingStatusHistory> BookingStatusHistory => Set<BookingStatusHistory>();
    public DbSet<CarDetail> CarDetail => Set<CarDetail>();
    public DbSet<CashbackRule> CashbackRules => Set<CashbackRule>();
    public DbSet<CheckInOutImage> CheckInOutImages => Set<CheckInOutImage>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<CustomerProfile> CustomerProfiles => Set<CustomerProfile>();
    public DbSet<CustomerDriverLicense> CustomerDriverLicenses => Set<CustomerDriverLicense>();
    public DbSet<DemandForecast> DemandForecasts => Set<DemandForecast>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeEvidenceSubmission> DisputeEvidenceSubmissions => Set<DisputeEvidenceSubmission>();
    public DbSet<DriverLicenseClass> DriverLicenseClasses => Set<DriverLicenseClass>();
    public DbSet<DriverLicenseClassCompatibility> DriverLicenseClassCompatibility => Set<DriverLicenseClassCompatibility>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();
    public DbSet<InspectionReport> InspectionReports => Set<InspectionReport>();
    public DbSet<MLPredictionLog> MLPredictionLogs => Set<MLPredictionLog>();
    public DbSet<MotorbikeDetail> MotorbikeDetail => Set<MotorbikeDetail>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<OwnerApplication> OwnerApplications => Set<OwnerApplication>();
    public DbSet<OwnerProfile> OwnerProfiles => Set<OwnerProfile>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<PlatformFeeRule> PlatformFeeRules => Set<PlatformFeeRule>();
    public DbSet<PricingRegion> PricingRegion => Set<PricingRegion>();
    public DbSet<PricingRule> PricingRules => Set<PricingRule>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Review> Reviews => Set<Review>();
    public new DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<StaffProfile> StaffProfiles => Set<StaffProfile>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<SystemConfig> SystemConfig => Set<SystemConfig>();
    public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
    public DbSet<TrustScore> TrustScores => Set<TrustScore>();
    public new DbSet<User> Users => Set<User>();
    public new DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleBrand> VehicleBrand => Set<VehicleBrand>();
    public DbSet<VehicleDocument> VehicleDocuments => Set<VehicleDocument>();
    public DbSet<VehicleFeature> VehicleFeature => Set<VehicleFeature>();
    public DbSet<VehicleFeatureMapping> VehicleFeatureMapping => Set<VehicleFeatureMapping>();
    public DbSet<VehicleImage> VehicleImages => Set<VehicleImage>();
    public DbSet<VehicleModel> VehicleModel => Set<VehicleModel>();
    public DbSet<VehicleModelVariant> VehicleModelVariant => Set<VehicleModelVariant>();
    public DbSet<VehicleModelPricing> VehicleModelPricing => Set<VehicleModelPricing>();
    public DbSet<VehiclePricing> VehiclePricing => Set<VehiclePricing>();
    public DbSet<VerificationRequest> VerificationRequests => Set<VerificationRequest>();
    public DbSet<Wallet> Wallets { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Wallet>();
        builder.Entity<WalletTransaction>().HasIndex(entity => entity.IdempotencyKey).IsUnique();
        builder.Entity<SystemConfig>().HasIndex(entity => entity.ConfigKey).IsUnique();
        builder.Entity<Booking>().Property(entity => entity.EscrowStatus).HasDefaultValue("None");
        builder.Entity<Booking>().HasIndex(entity => new { entity.Status, entity.PaymentDueAt });
        builder.Entity<WithdrawalRequest>();
        builder.Entity<CarDetail>().HasKey(entity => entity.VehicleId);
        builder.Entity<MotorbikeDetail>().HasKey(entity => entity.VehicleId);
        builder.Entity<DriverLicenseClass>().HasIndex(entity => entity.Code).IsUnique();
        builder.Entity<VehicleBrand>().HasIndex(entity => new { entity.Name, entity.VehicleType }).IsUnique();
        builder.Entity<DriverLicenseClassCompatibility>().HasKey(entity => new { entity.LicenseClassId, entity.AllowedRequiredLicenseClassId });
        builder.Entity<DriverLicenseClassCompatibility>()
            .HasOne<DriverLicenseClass>()
            .WithMany()
            .HasForeignKey(entity => entity.LicenseClassId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<DriverLicenseClassCompatibility>()
            .HasOne<DriverLicenseClass>()
            .WithMany()
            .HasForeignKey(entity => entity.AllowedRequiredLicenseClassId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<RolePermission>().HasKey(entity => new { entity.RoleId, entity.PermissionId });
        builder.Entity<VehicleFeatureMapping>().HasKey(entity => new { entity.VehicleId, entity.FeatureId });
        builder.Entity<PricingRegion>().HasIndex(entity => entity.Code).IsUnique();
        builder.Entity<Area>().HasIndex(entity => new { entity.Province, entity.District }).IsUnique();
        builder.Entity<VehicleModelPricing>().HasIndex(entity => entity.ModelId).IsUnique();
        builder.Entity<VehicleModelPricing>()
            .HasOne(x => x.Model)
            .WithMany()
            .HasForeignKey(x => x.ModelId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<PricingRule>()
            .HasOne(x => x.Brand)
            .WithMany()
            .HasForeignKey(x => x.BrandId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<PricingRule>()
            .HasOne(x => x.Model)
            .WithMany()
            .HasForeignKey(x => x.ModelId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<PricingRule>()
            .HasOne(x => x.PricingRegion)
            .WithMany()
            .HasForeignKey(x => x.PricingRegionId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<VehicleModelVariant>().HasIndex(entity => new { entity.ModelId, entity.Name });
        builder.Entity<VehicleModelVariant>()
            .HasOne<VehicleModel>()
            .WithMany()
            .HasForeignKey(entity => entity.ModelId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Vehicle>()
            .HasOne<VehicleModelVariant>()
            .WithMany()
            .HasForeignKey(entity => entity.VariantId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<Vehicle>()
            .HasOne<Area>()
            .WithMany()
            .HasForeignKey(entity => entity.AreaId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<Vehicle>().Property(entity => entity.DepositPercent).HasDefaultValue(0);
        builder.Entity<Vehicle>().HasIndex(entity => new { entity.OwnerId, entity.Status, entity.VehicleType });
        builder.Entity<Dispute>().Property(entity => entity.PlatformSettledAmount).HasDefaultValue(0);
        builder.Entity<Dispute>().Property(entity => entity.SettlementMethod).HasDefaultValue("DepositThenExternal");
        builder.Entity<Dispute>().Property(entity => entity.ExternalSettlementAmount).HasDefaultValue(0);
        builder.Entity<Dispute>()
            .HasIndex(entity => entity.BookingId)
            .IsUnique()
            .HasFilter("status <> 'Resolved'");
        builder.Entity<DisputeEvidenceSubmission>().HasIndex(entity => new { entity.DisputeId, entity.SubmittedBy });
        builder.Entity<VehicleDocument>().HasIndex(entity => entity.VehicleId);
        builder.Entity<VehicleDocument>().HasIndex(entity => new { entity.VehicleId, entity.IsCurrent });
        builder.Entity<VehicleDocument>().HasIndex(entity => entity.VerificationStatus);
        builder.Entity<VehicleDocument>()
            .Property(entity => entity.VerificationStatus)
            .HasConversion<string>()
            .HasDefaultValue(VehicleDocumentVerificationStatus.Pending);
        builder.Entity<VehicleDocument>().Property(entity => entity.IsCurrent).HasDefaultValue(true);
        builder.Entity<VehicleDocument>().Property(entity => entity.OcrConfidence).HasPrecision(15, 2);
        builder.Entity<VehicleModelVariant>()
            .HasOne<DriverLicenseClass>()
            .WithMany()
            .HasForeignKey(entity => entity.RequiredLicenseClassId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<CarDetail>()
            .HasOne<VehicleModelVariant>()
            .WithMany()
            .HasForeignKey(entity => entity.ModelVariantId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<MotorbikeDetail>()
            .HasOne<VehicleModelVariant>()
            .WithMany()
            .HasForeignKey(entity => entity.ModelVariantId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<CustomerProfile>().HasIndex(entity => entity.NationalIdHash);
        builder.Entity<CustomerDriverLicense>().HasIndex(entity => new { entity.UserId, entity.VehicleType }).IsUnique();
        builder.Entity<CustomerDriverLicense>().HasIndex(entity => entity.VerificationRequestId);
        builder.Entity<CustomerDriverLicense>().Property(entity => entity.OcrConfidence).HasPrecision(15, 2);
        builder.Entity<CustomerDriverLicense>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<CustomerDriverLicense>()
            .HasOne<VerificationRequest>()
            .WithMany()
            .HasForeignKey(entity => entity.VerificationRequestId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<OwnerApplication>().HasIndex(entity => new { entity.UserId, entity.Status });
        builder.Entity<OwnerApplication>().HasIndex(entity => entity.NationalIdVerificationRequestId);
        builder.Entity<OwnerApplication>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<OwnerApplication>()
            .HasOne<VerificationRequest>()
            .WithMany()
            .HasForeignKey(entity => entity.NationalIdVerificationRequestId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<VerificationRequest>().Property(entity => entity.ExternalResultJson).HasColumnType("jsonb");
        builder.Entity<VerificationRequest>().Property(entity => entity.Confidence).HasPrecision(15, 2);
        builder.Entity<VerificationRequest>().HasIndex(entity => new { entity.UserId, entity.Type, entity.Status });
        builder.Entity<VerificationRequest>().HasIndex(entity => new { entity.UserId, entity.Type, entity.CreatedAt });
        builder.Entity<VerificationRequest>().HasIndex(entity => new { entity.UserId, entity.Type, entity.RequestedVehicleType });

        ApplySnakeCaseColumnNames(builder);

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType).Property(nameof(BaseEntity.Id)).ValueGeneratedNever();
                builder.Entity(entityType.ClrType).HasQueryFilter(CreateSoftDeleteFilter(entityType.ClrType));
            }
        }
    }

    private static void ApplySnakeCaseColumnNames(ModelBuilder builder)
    {
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var builder = new StringBuilder(value.Length + 8);
        for (var index = 0; index < value.Length; index++)
        {
            var character = value[index];
            if (char.IsUpper(character))
            {
                if (index > 0)
                {
                    builder.Append('_');
                }

                builder.Append(char.ToLowerInvariant(character));
            }
            else
            {
                builder.Append(character);
            }
        }

        return builder.ToString();
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
