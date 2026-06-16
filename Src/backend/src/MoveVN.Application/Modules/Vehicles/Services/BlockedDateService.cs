using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class BlockedDateService : IBlockedDateService
{
    private readonly IBlockedDateRepository _repo;

    public BlockedDateService(IBlockedDateRepository repo)
    {
        _repo = repo;
    }

    public async Task<BlockedDateDto> CreateAsync(long vehicleId, long ownerId, CreateBlockedDateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.DateTo < request.DateFrom)
            throw new ValidationException(new[] { "DateTo phải >= DateFrom." });

        var vehicle = await _repo.GetVehicleAsync(vehicleId, cancellationToken)
            ?? throw new NotFoundException("Xe không tồn tại.");

        if (vehicle.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền chỉnh sửa xe này." });

        var hasBooking = await _repo.HasBookingOverlapAsync(vehicleId, request.DateFrom, request.DateTo, cancellationToken);
        if (hasBooking)
            throw new ValidationException(new[] { "Khoảng ngày này đã có booking, không thể block." });

        var blocked = new BlockedDate
        {
            VehicleId = vehicleId,
            StartDate = request.DateFrom,
            EndDate = request.DateTo,
            Reason = request.Reason
        };

        await _repo.AddAsync(blocked, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        return new BlockedDateDto
        {
            Id = blocked.Id,
            VehicleId = blocked.VehicleId,
            DateFrom = blocked.StartDate,
            DateTo = blocked.EndDate,
            Reason = blocked.Reason,
            CreatedAt = blocked.CreatedAt
        };
    }

    public async Task<List<BlockedDateDto>> GetByVehicleAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByVehicleAsync(vehicleId, cancellationToken);
    }

    public async Task DeleteAsync(long id, long ownerId, CancellationToken cancellationToken = default)
    {
        var blocked = await _repo.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("BlockedDate không tồn tại.");

        var vehicle = await _repo.GetVehicleAsync(blocked.VehicleId, cancellationToken);
        if (vehicle?.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền xóa mục này." });

        _repo.Remove(blocked);
        await _repo.SaveChangesAsync(cancellationToken);
    }
}
