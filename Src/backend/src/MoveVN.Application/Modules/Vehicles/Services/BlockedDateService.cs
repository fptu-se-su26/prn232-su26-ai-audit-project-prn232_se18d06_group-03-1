using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class BlockedDateService : IBlockedDateService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IMapper _mapper;

    public BlockedDateService(IVehicleCatalogRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<BlockedDateResponse> CreateAsync(long vehicleId, long ownerId, BlockedDateRequest request, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.Vehicles
            .FirstOrDefaultAsync(v => v.Id == vehicleId && v.OwnerId == ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        if (request.DateFrom > request.DateTo)
            throw new AppException(ErrorCode.BLOCKED_DATE_INVALID_RANGE);

        var blockedStart = request.DateFrom.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var blockedEndExclusive = request.DateTo.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var hasOverlap = await _repository.Bookings
            .AnyAsync(b =>
                b.VehicleId == vehicleId &&
                b.StartDate < blockedEndExclusive &&
                b.EndDate > blockedStart &&
                b.Status != "Cancelled" &&
                b.Status != "Rejected", cancellationToken);

        if (hasOverlap)
            throw new AppException(ErrorCode.BLOCKED_DATE_OVERLAP_BOOKING);

        var entity = new BlockedDate
        {
            VehicleId = vehicleId,
            StartDate = request.DateFrom,
            EndDate = request.DateTo,
            Reason = request.Reason?.Trim()
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);

        return _mapper.Map<BlockedDateResponse>(entity);
    }

    public async Task<List<BlockedDateResponse>> GetByVehicleAsync(long vehicleId, long ownerId, CancellationToken cancellationToken = default)
    {
        var exists = await _repository.Vehicles
            .AnyAsync(v => v.Id == vehicleId && v.OwnerId == ownerId, cancellationToken);

        if (!exists)
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        var blockedDates = await _repository.BlockedDates
            .Where(b => b.VehicleId == vehicleId)
            .OrderByDescending(b => b.StartDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<BlockedDateResponse>>(blockedDates);
    }

    public async Task DeleteAsync(long blockedDateId, long ownerId, CancellationToken cancellationToken = default)
    {
        var blockedDate = await _repository.BlockedDates
            .FirstOrDefaultAsync(b => b.Id == blockedDateId, cancellationToken)
            ?? throw new AppException(ErrorCode.BLOCKED_DATE_NOT_FOUND);

        var vehicle = await _repository.Vehicles
            .FirstOrDefaultAsync(v => v.Id == blockedDate.VehicleId, cancellationToken);

        if (vehicle is null || vehicle.OwnerId != ownerId)
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        _repository.Remove(blockedDate);
        await _repository.SaveChangesAsync(cancellationToken);
    }
}
