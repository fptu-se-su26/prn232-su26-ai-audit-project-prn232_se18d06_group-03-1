using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Admin.DTOs;
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
    Task<StaffProfile?> GetStaffProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    void Update(User user);

    Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    void UpdateCustomerProfile(CustomerProfile profile);
    Task<OwnerProfile?> GetOwnerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    void UpdateOwnerProfile(OwnerProfile profile);

    Task AddOwnerApplicationAsync(OwnerApplication application, CancellationToken cancellationToken = default);
    Task<OwnerApplication?> GetLatestOwnerApplicationByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveOwnerApplicationAsync(long userId, CancellationToken cancellationToken = default);
    void UpdateOwnerApplication(OwnerApplication application);

    Task AddVerificationRequestAsync(VerificationRequest request, CancellationToken cancellationToken = default);
    void UpdateVerificationRequest(VerificationRequest request);
    Task<VerificationRequest?> GetVerificationRequestByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetLatestNationalIdVerificationByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<List<VerificationRequest>> GetVerificationRequestsByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<(List<NationalIdVerificationListItem> Items, int TotalCount)> GetNationalIdVerificationsPagedAsync(string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<NationalIdVerificationDetailDto?> GetNationalIdVerificationDetailAsync(long id, CancellationToken cancellationToken = default);
    Task<(List<AdminUserListItem> Items, int TotalCount)> GetAdminUserListAsync(string? keyword, string? sortBy, string? role, string? status, bool? isOnline, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<OwnerApplication?> GetOwnerApplicationByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<StaffOwnerApplicationQueryResult>> GetOwnerApplicationsByFilterAsync(string? status, string? keyword, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    Task<OwnerApplicationCurrentData?> GetOwnerApplicationCurrentDataAsync(long userId, CancellationToken cancellationToken = default);
}
