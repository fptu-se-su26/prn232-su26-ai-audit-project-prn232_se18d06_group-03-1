using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Vehicles;

public class VehicleRepository : IVehicleRepository
{
    private readonly AppDbContext _context;

    public VehicleRepository(AppDbContext context) => _context = context;

    public async Task<Vehicle?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id, ct);

    public async Task AddVehicleAsync(Vehicle vehicle, CancellationToken ct = default)
        => await _context.Vehicles.AddAsync(vehicle, ct);

    public void UpdateVehicle(Vehicle vehicle) => _context.Vehicles.Update(vehicle);

    public async Task AddCarDetailAsync(CarDetail detail, CancellationToken ct = default)
        => await _context.CarDetails.AddAsync(detail, ct);

    public async Task AddImageAsync(VehicleImage image, CancellationToken ct = default)
        => await _context.VehicleImages.AddAsync(image, ct);

    public async Task<int> CountImagesAsync(long vehicleId, CancellationToken ct = default)
        => await _context.VehicleImages.CountAsync(i => i.VehicleId == vehicleId, ct);

    public async Task<List<VehicleImageDto>> GetImagesAsync(long vehicleId, CancellationToken ct = default)
        => await _context.VehicleImages
            .Where(i => i.VehicleId == vehicleId)
            .Select(i => new VehicleImageDto { Id = i.Id, ImageUrl = i.ImageUrl, IsPrimary = i.IsPrimary })
            .ToListAsync(ct);

    public async Task<(decimal? avg, int count)> GetRatingAsync(long vehicleId, CancellationToken ct = default)
    {
        var ratings = await _context.Reviews.Where(r => r.VehicleId == vehicleId).ToListAsync(ct);
        return ratings.Count == 0 ? (null, 0) : ((decimal?)ratings.Average(r => r.Rating), ratings.Count);
    }

    public async Task<PagedResult<VehicleResponse>> GetPublicPagedAsync(VehicleListRequest request, CancellationToken ct = default)
    {
        var query = _context.Vehicles.Where(v => v.Status == "Available").AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(v => new VehicleResponse
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
                CreatedAt = v.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<VehicleResponse>.Create(items, total, request.Page, request.PageSize);
    }

    public async Task<PagedResult<VehicleResponse>> GetByStatusPagedAsync(string status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.Vehicles.Where(v => v.Status == status).AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(v => new VehicleResponse
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
                CreatedAt = v.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<VehicleResponse>.Create(items, total, page, pageSize);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
