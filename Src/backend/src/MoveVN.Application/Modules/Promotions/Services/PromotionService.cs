using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Promotions.DTOs;
using MoveVN.Application.Modules.Promotions.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Promotions.Services;

public class PromotionService : IPromotionService
{
    private readonly IPromotionRepository _repo;

    public PromotionService(IPromotionRepository repo)
    {
        _repo = repo;
    }

    public async Task<PromotionResponse> CreateAsync(CreatePromotionRequest req, long? ownerIdOverride, CancellationToken ct = default)
    {
        var code = req.Code.Trim().ToUpperInvariant();
        var existing = await _repo.GetByCodeAsync(code, ct);
        if (existing is not null)
        {
            if (existing.ApprovalStatus != "Rejected")
                throw new ValidationException(new[] { $"Mã khuyến mãi '{code}' đã tồn tại." });
            _repo.Remove(existing);
            await _repo.SaveChangesAsync(ct);
        }

        var entity = new Promotion
        {
            Code = code,
            Name = req.Name,
            Description = req.Description,
            DiscountType = req.DiscountType,
            DiscountValue = req.DiscountValue,
            MaxDiscountAmount = req.MaxDiscountAmount,
            MinOrderAmount = req.MinOrderAmount,
            VehicleType = req.VehicleType,
            WhoBears = req.WhoBears,
            OwnerBearsPercent = req.WhoBears == "Shared" ? req.OwnerBearsPercent : null,
            OwnerId = ownerIdOverride ?? (req.WhoBears == "System" ? null : req.OwnerId),
            StartAt = ToUtc(req.StartAt),
            EndAt = req.EndAt.HasValue ? ToUtc(req.EndAt.Value) : null,
            MaxUsageCount = req.MaxUsageCount,
            IsActive = true,
            ApprovalStatus = req.WhoBears == "System" && ownerIdOverride == null ? "Approved" : "Pending",
            CreatedByRole = ownerIdOverride.HasValue ? "Owner" : "Admin",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(entity, ct);
        await _repo.SaveChangesAsync(ct);

        return MapToResponse(entity);
    }

    public async Task<PromotionResponse> UpdateAsync(long id, UpdatePromotionRequest req, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Không tìm thấy mã khuyến mãi.");

        if (req.Name is not null) entity.Name = req.Name;
        if (req.Description is not null) entity.Description = req.Description;
        if (req.DiscountValue.HasValue) entity.DiscountValue = req.DiscountValue.Value;
        if (req.MaxDiscountAmount.HasValue) entity.MaxDiscountAmount = req.MaxDiscountAmount;
        if (req.MinOrderAmount.HasValue) entity.MinOrderAmount = req.MinOrderAmount;
        if (req.VehicleType is not null) entity.VehicleType = req.VehicleType;
        if (req.WhoBears is not null)
        {
            entity.WhoBears = req.WhoBears;
            entity.OwnerBearsPercent = req.WhoBears == "Shared" ? req.OwnerBearsPercent : null;
        }
        if (req.StartAt.HasValue) entity.StartAt = ToUtc(req.StartAt.Value);
        if (req.EndAt.HasValue) entity.EndAt = ToUtc(req.EndAt.Value);
        if (req.MaxUsageCount.HasValue) entity.MaxUsageCount = req.MaxUsageCount.Value;
        if (req.IsActive.HasValue) entity.IsActive = req.IsActive.Value;
        entity.UpdatedAt = DateTime.UtcNow;

        _repo.Update(entity);
        await _repo.SaveChangesAsync(ct);
        return MapToResponse(entity);
    }

    public async Task<bool> DeleteAsync(long id, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Không tìm thấy mã khuyến mãi.");
        _repo.Remove(entity);
        await _repo.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ToggleActiveAsync(long id, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Không tìm thấy mã khuyến mãi.");
        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        _repo.Update(entity);
        await _repo.SaveChangesAsync(ct);
        return entity.IsActive;
    }

    public async Task<PromotionResponse?> GetByIdAsync(long id, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct);
        return entity is null ? null : MapToResponse(entity);
    }

    public async Task<(List<PromotionResponse> Items, int TotalCount)> GetListAsync(
        string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        var total = await _repo.GetListCountAsync(keyword, isActive, ct);
        var items = await _repo.GetListAsync(keyword, isActive, page, pageSize, ct);
        return (items.Select(MapToResponse).ToList(), total);
    }

    public async Task<ApplyPromotionResponse> ValidateAndCalculateAsync(
        ApplyPromotionRequest req, long customerId, CancellationToken ct)
    {
        var code = req.Code.Trim().ToUpperInvariant();
        var promo = await _repo.GetByCodeAsync(code, ct);
        if (promo is null)
            return Fail("Mã khuyến mãi không tồn tại.");
        if (!promo.IsActive)
            return Fail("Mã khuyến mãi đã bị vô hiệu hóa.");
        var now = DateTime.UtcNow;
        if (promo.ApprovalStatus == "Pending")
            return Fail("Mã khuyến mãi đang chờ chủ xe duyệt.");
        if (promo.ApprovalStatus == "Rejected")
            return Fail("Mã khuyến mãi đã bị chủ xe từ chối.");
        if (promo.StartAt.Date > now.Date)
            return Fail("Mã khuyến mãi chưa đến hạn sử dụng.");
        if (promo.EndAt.HasValue && promo.EndAt.Value.Date < now.Date)
            return Fail("Mã khuyến mãi đã hết hạn.");
        if (promo.UsageCount >= promo.MaxUsageCount)
            return Fail("Mã khuyến mãi đã hết lượt sử dụng.");

        if (promo.MinOrderAmount.HasValue && req.TotalAmount < promo.MinOrderAmount.Value)
            return Fail($"Đơn hàng tối thiểu {promo.MinOrderAmount.Value:N0}đ để sử dụng mã này.");

        if (promo.VehicleType != "All")
        {
            var vehicle = await _repo.GetVehicleByIdAsync(req.VehicleId, ct);
            if (vehicle is null)
                return Fail("Không tìm thấy xe.");

            if (promo.VehicleType == "Motorbike" && vehicle.VehicleType != "Motorbike")
                return Fail("Mã này chỉ áp dụng cho xe máy.");
            if (promo.VehicleType == "Car" && vehicle.VehicleType != "Car")
                return Fail("Mã này chỉ áp dụng cho ô tô.");
        }

        if (promo.WhoBears == "Owner" && promo.OwnerId.HasValue)
        {
            var vehicle = await _repo.GetVehicleByIdAsync(req.VehicleId, ct);
            if (vehicle is null)
                return Fail("Không tìm thấy xe.");
            if (vehicle.OwnerId != promo.OwnerId.Value)
                return Fail("Mã này không áp dụng cho xe này.");
        }

        decimal discount = promo.DiscountType == "Fixed"
            ? promo.DiscountValue
            : Math.Round(req.TotalAmount * promo.DiscountValue / 100m, 0);

        if (promo.MaxDiscountAmount.HasValue && discount > promo.MaxDiscountAmount.Value)
            discount = promo.MaxDiscountAmount.Value;

        discount = Math.Min(discount, req.TotalAmount);

        decimal systemPaid = 0;
        decimal ownerPaid = 0;
        switch (promo.WhoBears)
        {
            case "System":
                systemPaid = discount;
                break;
            case "Owner":
                ownerPaid = discount;
                break;
            case "Shared":
                var ownerPct = promo.OwnerBearsPercent ?? 50m;
                ownerPaid = Math.Round(discount * ownerPct / 100m, 0);
                systemPaid = discount - ownerPaid;
                break;
        }

        return new ApplyPromotionResponse
        {
            Success = true,
            PromotionId = promo.Id,
            Code = promo.Code,
            DiscountAmount = discount,
            SystemPaidAmount = systemPaid,
            OwnerPaidAmount = ownerPaid,
            FinalAmount = req.TotalAmount - discount,
        };
    }

    public async Task<List<PromotionUsageResponse>> GetUsagesAsync(long promotionId, CancellationToken ct)
    {
        var usages = await _repo.GetUsagesAsync(promotionId, ct);
        return usages.Select(u => new PromotionUsageResponse
        {
            Id = u.Id,
            PromotionId = u.PromotionId,
            BookingId = u.BookingId,
            UserId = u.UserId,
            DiscountAmount = u.DiscountAmount,
            SystemPaidAmount = u.SystemPaidAmount,
            OwnerPaidAmount = u.OwnerPaidAmount,
            CreatedAt = u.CreatedAt,
        }).ToList();
    }

    public async Task<List<PromotionResponse>> GetActiveForCustomerAsync(long? vehicleId, CancellationToken ct)
    {
        var promos = await _repo.GetActivePromotionsAsync(DateTime.UtcNow, ct);

        if (vehicleId.HasValue)
        {
            var vehicle = await _repo.GetVehicleByIdAsync(vehicleId.Value, ct);
            if (vehicle is not null)
                promos = promos.Where(p => p.VehicleType == "All" || p.VehicleType == vehicle.VehicleType).ToList();
        }

        return promos.Select(MapToResponse).ToList();
    }

    private static PromotionResponse MapToResponse(Promotion p) => new()
    {
        Id = p.Id,
        Code = p.Code,
        Name = p.Name,
        Description = p.Description,
        DiscountType = p.DiscountType,
        DiscountValue = p.DiscountValue,
        MaxDiscountAmount = p.MaxDiscountAmount,
        MinOrderAmount = p.MinOrderAmount,
        VehicleType = p.VehicleType,
        WhoBears = p.WhoBears,
        OwnerBearsPercent = p.OwnerBearsPercent,
        OwnerId = p.OwnerId,
        StartAt = p.StartAt,
        EndAt = p.EndAt,
        MaxUsageCount = p.MaxUsageCount,
        UsageCount = p.UsageCount,
        IsActive = p.IsActive,
        ApprovalStatus = p.ApprovalStatus,
        CreatedByRole = p.CreatedByRole,
        CreatedAt = p.CreatedAt,
    };

    private static ApplyPromotionResponse Fail(string msg) => new() { Success = false, Message = msg };

    public async Task<PromotionResponse> ApproveAsync(long id, long ownerId, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Không tìm thấy mã khuyến mãi.");
        if (entity.CreatedByRole != "Admin")
            throw new ValidationException(["Chỉ duyệt được mã do admin tạo."]);
        if (entity.OwnerId != null && entity.OwnerId != ownerId)
            throw new ValidationException(["Bạn không có quyền duyệt mã này."]);
        if (entity.ApprovalStatus != "Pending")
            throw new ValidationException(["Mã này không ở trạng thái chờ duyệt."]);
        entity.ApprovalStatus = "Approved";
        entity.UpdatedAt = DateTime.UtcNow;
        _repo.Update(entity);
        await _repo.SaveChangesAsync(ct);
        return MapToResponse(entity);
    }

    public async Task<PromotionResponse> RejectAsync(long id, long ownerId, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Không tìm thấy mã khuyến mãi.");
        if (entity.CreatedByRole != "Admin")
            throw new ValidationException(["Chỉ từ chối được mã do admin tạo."]);
        if (entity.OwnerId != null && entity.OwnerId != ownerId)
            throw new ValidationException(["Bạn không có quyền từ chối mã này."]);
        if (entity.ApprovalStatus != "Pending")
            throw new ValidationException(["Mã này không ở trạng thái chờ duyệt."]);
        entity.ApprovalStatus = "Rejected";
        entity.UpdatedAt = DateTime.UtcNow;
        _repo.Update(entity);
        await _repo.SaveChangesAsync(ct);
        return MapToResponse(entity);
    }

    public async Task<List<PromotionResponse>> GetPendingForOwnerAsync(long ownerId, CancellationToken ct)
    {
        var items = await _repo.GetPendingForOwnerAsync(ownerId, ct);
        return items.Select(MapToResponse).ToList();
    }

    public async Task<List<PromotionResponse>> GetMyPromotionsAsync(long ownerId, CancellationToken ct)
    {
        var items = await _repo.GetMyPromotionsAsync(ownerId, ct);
        return items.Select(MapToResponse).ToList();
    }

    public async Task<PromotionResponse> AdminUpdateApprovalAsync(long id, string status, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Không tìm thấy mã khuyến mãi.");
        if (entity.CreatedByRole != "Owner")
            throw new ValidationException(["Admin chỉ duyệt/từ chối mã do chủ xe tạo."]);
        if (entity.ApprovalStatus != "Pending")
            throw new ValidationException(["Mã này không ở trạng thái chờ duyệt."]);
        entity.ApprovalStatus = status;
        entity.UpdatedAt = DateTime.UtcNow;
        _repo.Update(entity);
        await _repo.SaveChangesAsync(ct);
        return MapToResponse(entity);
    }

    private static DateTime ToUtc(DateTime dt)
    {
        if (dt.Kind == DateTimeKind.Utc) return dt;
        if (dt.Kind == DateTimeKind.Local) return dt.ToUniversalTime();
        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }
}
