using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.DriverLicenses.Interfaces;

public interface ICustomerDriverLicenseRepository
{
    Task<List<CustomerDriverLicense>> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<CustomerDriverLicense?> GetByUserIdAndVehicleTypeAsync(long userId, string vehicleType, CancellationToken cancellationToken = default);
    Task<bool> HasAnyVerifiedAsync(long userId, CancellationToken cancellationToken = default);
    Task AddAsync(CustomerDriverLicense license, CancellationToken cancellationToken = default);
    void Update(CustomerDriverLicense license);
}
