using MoveVN.Domain.Entities;

namespace MoveVN.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByPhoneAsync(string phone, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task AddCustomerProfileAsync(CustomerProfile profile, CancellationToken cancellationToken = default);
    Task AddOwnerProfileAsync(OwnerProfile profile, CancellationToken cancellationToken = default);
    Task AddStaffProfileAsync(StaffProfile profile, CancellationToken cancellationToken = default);
    void Update(User user);
}
