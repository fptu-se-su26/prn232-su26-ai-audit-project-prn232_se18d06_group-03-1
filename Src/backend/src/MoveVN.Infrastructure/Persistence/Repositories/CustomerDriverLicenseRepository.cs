using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class CustomerDriverLicenseRepository : ICustomerDriverLicenseRepository
{
    private readonly AppDbContext _context;

    public CustomerDriverLicenseRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<List<CustomerDriverLicense>> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.CustomerDriverLicenses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.VehicleType)
            .ToListAsync(cancellationToken);
    }

    public Task<CustomerDriverLicense?> GetByUserIdAndVehicleTypeAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
    {
        return _context.CustomerDriverLicenses
            .FirstOrDefaultAsync(x => x.UserId == userId && x.VehicleType == vehicleType, cancellationToken);
    }

    public Task<bool> HasAnyVerifiedAsync(long userId, CancellationToken cancellationToken = default)
    {
        return _context.CustomerDriverLicenses.AnyAsync(x => x.UserId == userId, cancellationToken);
    }

    public async Task AddAsync(CustomerDriverLicense license, CancellationToken cancellationToken = default)
    {
        await _context.CustomerDriverLicenses.AddAsync(license, cancellationToken);
    }

    public void Update(CustomerDriverLicense license)
    {
        _context.CustomerDriverLicenses.Update(license);
    }
}
