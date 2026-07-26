using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Customer")]
[Route("api/customer/favorite-vehicles")]
public class CustomerFavoriteVehiclesController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public CustomerFavoriteVehiclesController(AppDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("ids")]
    public async Task<ActionResult<ApiResponse<List<long>>>> GetIds(CancellationToken cancellationToken)
    {
        var customerId = RequireCustomerId();
        var ids = await _context.FavoriteVehicles.AsNoTracking()
            .Where(item => item.CustomerId == customerId)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => item.VehicleId)
            .ToListAsync(cancellationToken);
        return Success(ids);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleListItemResponse>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var customerId = RequireCustomerId();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query =
            from favorite in _context.FavoriteVehicles.AsNoTracking()
            join vehicle in _context.Vehicles.AsNoTracking() on favorite.VehicleId equals vehicle.Id
            where favorite.CustomerId == customerId && vehicle.Status == VehicleStatus.Approved
            orderby favorite.CreatedAt descending
            select new { favorite, vehicle };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(item => new VehicleListItemResponse
            {
                Id = item.vehicle.Id,
                BrandName = item.vehicle.Brand.Name,
                ModelName = item.vehicle.Model.Name,
                VariantName = item.vehicle.Variant != null ? item.vehicle.Variant.Name : null,
                VehicleType = item.vehicle.VehicleType,
                Year = item.vehicle.Year,
                LicensePlate = item.vehicle.LicensePlate,
                PricePerDay = item.vehicle.PricePerDay,
                DepositPercent = item.vehicle.DepositPercent,
                SecurityRequiresDeposit = item.vehicle.SecurityRequiresDeposit,
                SecurityDepositAmount = item.vehicle.SecurityDepositAmount,
                AreaName = item.vehicle.Area != null ? item.vehicle.Area.Province + " - " + item.vehicle.Area.District : null,
                PricingMode = item.vehicle.Pricing != null ? item.vehicle.Pricing.PricingMode : null,
                Status = item.vehicle.Status,
                FeaturedImage = _context.VehicleImages
                    .Where(image => image.VehicleId == item.vehicle.Id)
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),
                AverageRating = _context.Reviews
                    .Where(review => review.VehicleId == item.vehicle.Id && review.IsPublic)
                    .Select(review => (double?)review.Rating)
                    .Average() ?? 0,
                ReviewCount = _context.Reviews.Count(review => review.VehicleId == item.vehicle.Id && review.IsPublic),
                CreatedAt = item.vehicle.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Success(new PagedResult<VehicleListItemResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPut("{vehicleId:long}")]
    public async Task<ActionResult<ApiResponse<object>>> Add(long vehicleId, CancellationToken cancellationToken)
    {
        var customerId = RequireCustomerId();
        var vehicleExists = await _context.Vehicles.AnyAsync(
            vehicle => vehicle.Id == vehicleId && vehicle.Status == VehicleStatus.Approved,
            cancellationToken);
        if (!vehicleExists) return NotFound();

        await _context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "FavoriteVehicles" (customer_id, vehicle_id, created_at)
            VALUES ({customerId}, {vehicleId}, {DateTime.UtcNow})
            ON CONFLICT (customer_id, vehicle_id) DO NOTHING
            """, cancellationToken);

        return Success<object>(new { vehicleId, isFavorite = true }, "Đã thêm xe vào danh sách yêu thích.");
    }

    [HttpDelete("{vehicleId:long}")]
    public async Task<ActionResult<ApiResponse<object>>> Remove(long vehicleId, CancellationToken cancellationToken)
    {
        var customerId = RequireCustomerId();
        await _context.FavoriteVehicles
            .Where(item => item.CustomerId == customerId && item.VehicleId == vehicleId)
            .ExecuteDeleteAsync(cancellationToken);
        return Success<object>(new { vehicleId, isFavorite = false }, "Đã bỏ xe khỏi danh sách yêu thích.");
    }

    private long RequireCustomerId()
        => _currentUser.UserId ?? throw new UnauthorizedAccessException();
}
