using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class VehicleService : IVehicleService
{
    private readonly IVehicleRepository _repo;
    private readonly ICurrentUserContext _ctx;
    private readonly ICloudinaryService _cloudinary;
    private readonly INotificationService _notifications;
    private readonly IAuditLogService _auditLog;

    public VehicleService(
        IVehicleRepository repo,
        ICurrentUserContext ctx,
        ICloudinaryService cloudinary,
        INotificationService notifications,
        IAuditLogService auditLog)
    {
        _repo = repo;
        _ctx = ctx;
        _cloudinary = cloudinary;
        _notifications = notifications;
        _auditLog = auditLog;
    }

    public async Task<VehicleResponse> CreateAsync(CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = _ctx.DomainUserId
            ?? throw new ValidationException(new[] { "Không xác định được người dùng." });

        var vehicle = new Vehicle
        {
            OwnerId = ownerId,
            BrandId = request.BrandId,
            ModelId = request.ModelId,
            Year = request.Year,
            LicensePlate = request.LicensePlate.ToUpperInvariant(),
            Description = request.Description,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            PricePerDay = request.PricePerDay,
            Status = "Pending"
        };

        await _repo.AddVehicleAsync(vehicle, cancellationToken);

        if (request.SeatCount.HasValue)
        {
            var carDetail = new CarDetail
            {
                VehicleId = vehicle.Id,
                SeatCount = (byte)request.SeatCount.Value,
                Transmission = request.Transmission ?? "Manual",
                FuelType = request.FuelType ?? "Gasoline",
                BodyType = request.BodyType ?? "Sedan"
            };
            await _repo.AddCarDetailAsync(carDetail, cancellationToken);
        }

        await _repo.SaveChangesAsync(cancellationToken);
        return await MapToResponseAsync(vehicle, cancellationToken);
    }

    public async Task<List<VehicleImageDto>> UploadImagesAsync(long vehicleId, IList<IFormFile> files, CancellationToken cancellationToken = default)
    {
        var ownerId = _ctx.DomainUserId
            ?? throw new ValidationException(new[] { "Không xác định được người dùng." });

        var vehicle = await _repo.GetByIdAsync(vehicleId, cancellationToken)
            ?? throw new NotFoundException("Xe không tồn tại.");

        if (vehicle.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền thao tác trên xe này." });

        var existingCount = await _repo.CountImagesAsync(vehicleId, cancellationToken);
        if (existingCount + files.Count > 10)
            throw new ValidationException(new[] { "Tối đa 10 ảnh mỗi xe." });

        var result = new List<VehicleImageDto>();
        byte order = (byte)existingCount;

        foreach (var file in files)
        {
            var url = await _cloudinary.UploadImageAsync(file, "vehicles", cancellationToken);
            var img = new VehicleImage
            {
                VehicleId = vehicleId,
                ImageUrl = url,
                IsPrimary = existingCount == 0 && order == 0,
                SortOrder = order++
            };
            await _repo.AddImageAsync(img, cancellationToken);
            result.Add(new VehicleImageDto { Id = img.Id, ImageUrl = img.ImageUrl, IsPrimary = img.IsPrimary, SortOrder = img.SortOrder });
        }

        await _repo.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<PagedResult<VehicleResponse>> GetPublicListAsync(VehicleListRequest request, CancellationToken cancellationToken = default)
    {
        return await _repo.GetPublicPagedAsync(request, cancellationToken);
    }

    public async Task<VehicleResponse> GetByIdPublicAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repo.GetByIdAsync(vehicleId, cancellationToken)
            ?? throw new NotFoundException("Xe không tồn tại.");

        if (vehicle.Status != "Available")
            throw new NotFoundException("Xe không có sẵn.");

        return await MapToResponseAsync(vehicle, cancellationToken);
    }

    public async Task ApproveAsync(long vehicleId, long staffId, ApproveVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repo.GetByIdAsync(vehicleId, cancellationToken)
            ?? throw new NotFoundException("Xe không tồn tại.");

        var oldStatus = vehicle.Status;
        vehicle.Status = request.Approve ? "Available" : "Rejected";
        vehicle.ApprovedBy = staffId;
        vehicle.ApprovedAt = DateTime.UtcNow;
        vehicle.RejectionReason = request.Approve ? null : request.Reason;

        _repo.UpdateVehicle(vehicle);
        await _repo.SaveChangesAsync(cancellationToken);

        // Notify owner
        var title = request.Approve ? "Xe đã được duyệt" : "Xe bị từ chối";
        var body = request.Approve
            ? $"Xe biển số {vehicle.LicensePlate} đã được duyệt và có thể nhận booking."
            : $"Xe biển số {vehicle.LicensePlate} bị từ chối. Lý do: {request.Reason}";

        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = vehicle.OwnerId,
            Type = request.Approve ? "VehicleApproved" : "VehicleRejected",
            Title = title,
            Body = body
        }));

        _ = Task.Run(() => _auditLog.LogAsync(staffId, "Staff", request.Approve ? "ApproveVehicle" : "RejectVehicle",
            "Vehicle", vehicleId, oldStatus, vehicle.Status));
    }

    public async Task<PagedResult<VehicleResponse>> GetPendingQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByStatusPagedAsync("Pending", page, pageSize, cancellationToken);
    }

    private async Task<VehicleResponse> MapToResponseAsync(Vehicle v, CancellationToken cancellationToken)
    {
        var images = await _repo.GetImagesAsync(v.Id, cancellationToken);
        var (avg, count) = await _repo.GetRatingAsync(v.Id, cancellationToken);

        return new VehicleResponse
        {
            Id = v.Id,
            OwnerId = v.OwnerId,
            LicensePlate = v.LicensePlate,
            BrandId = v.BrandId,
            ModelId = v.ModelId,
            Year = v.Year,
            Description = v.Description,
            Address = v.Address,
            PricePerDay = v.PricePerDay,
            Status = v.Status,
            AverageRating = avg,
            ReviewCount = count,
            Images = images,
            CreatedAt = v.CreatedAt
        };
    }
}
