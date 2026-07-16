using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Admin.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IAuthActivityLogger _activityLogger;
    private readonly IPresenceService _presenceService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AdminUserService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IPasswordHasherService passwordHasherService,
        IAuthActivityLogger activityLogger,
        IPresenceService presenceService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _passwordHasherService = passwordHasherService;
        _activityLogger = activityLogger;
        _presenceService = presenceService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<AdminUserListItem>> GetUsersAsync(string? keyword, string? sortBy, string? role, string? status, bool? isOnline, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _userRepository.GetAdminUserListAsync(keyword, sortBy, role, status, isOnline, page, pageSize, cancellationToken);
        var redisStatuses = await _presenceService.GetOnlineStatusesAsync(items.Select(user => user.UserId), cancellationToken);

        foreach (var user in items)
        {
            if (redisStatuses.TryGetValue(user.UserId, out var online))
            {
                user.IsOnline = user.IsOnline || online;
            }
        }

        return new PagedResult<AdminUserListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminUserDetailDto?> GetUserByIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null) return null;

        var roleNames = await _roleRepository.GetUserRoleNamesAsync(userId, cancellationToken);
        var presence = await _presenceService.GetOnlineStatusAsync(userId, cancellationToken);
        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);
        var ownerProfile = await _userRepository.GetOwnerProfileByUserIdAsync(userId, cancellationToken);
        var verificationRequests = await _userRepository.GetVerificationRequestsByUserIdAsync(userId, cancellationToken);

        StaffProfileDto? staffProfile = null;
        if (roleNames.Contains("Staff"))
        {
            var staff = await _userRepository.GetStaffProfileByUserIdAsync(userId, cancellationToken);
            if (staff != null)
            {
                staffProfile = new StaffProfileDto
                {
                    EmployeeCode = staff.EmployeeCode,
                    Department = staff.Department
                };
            }
        }

        return new AdminUserDetailDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            Status = user.Status,
            IsEmailVerified = user.IsEmailVerified,
            IsOnline = presence?.IsOnline ?? false,
            LastSeenAt = presence?.LastSeenAt ?? user.LastSeenAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Roles = roleNames.ToList(),
            CustomerProfile = customerProfile != null ? new CustomerProfileDto
            {
                DateOfBirth = customerProfile.DateOfBirth,
                Address = customerProfile.Address,
                NationalIdMasked = customerProfile.NationalIdMasked,
                NationalIdVerified = customerProfile.NationalIdVerified,
                DriverLicenseVerified = customerProfile.DriverLicenseVerified,
                PreferredVehicleType = customerProfile.PreferredVehicleType
            } : null,
            OwnerProfile = ownerProfile != null ? new OwnerProfileDto
            {
                Tier = ownerProfile.Tier,
                CommissionRate = ownerProfile.CommissionRate,
                TotalTrips = ownerProfile.TotalTrips,
                AverageRating = ownerProfile.AverageRating,
                IsVerified = ownerProfile.IsVerified,
                VerifiedAt = ownerProfile.VerifiedAt,
                BankName = ownerProfile.BankName,
                BankAccountHolderName = ownerProfile.BankAccountHolderName
            } : null,
            StaffProfile = staffProfile,
            VerificationHistory = verificationRequests.Select(v => new VerificationHistoryDto
            {
                Id = v.Id,
                Type = v.Type,
                Status = v.Status,
                Confidence = v.Confidence,
                RejectionReason = v.RejectionReason,
                CreatedAt = v.CreatedAt,
                ReviewedAt = v.ReviewedAt
            }).ToList()
        };
    }

    public async Task UpdateUserAsync(long userId, AdminUpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone?.Trim();
        user.AvatarUrl = request.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateUserRoleAsync(long userId, UpdateUserRoleRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        if (!Enum.TryParse<UserRoleType>(request.Role, ignoreCase: true, out var roleType))
        {
            throw new AppException(ErrorCode.INVALID_ROLE);
        }

        var role = await _roleRepository.GetByNameAsync(roleType, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);

        if (request.Assigned)
        {
            var existingRoles = await _roleRepository.GetUserRoleNamesAsync(userId, cancellationToken);
            if (existingRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
            {
                return;
            }

            await _roleRepository.AddUserRoleAsync(new UserRole
            {
                UserId = userId,
                RoleId = role.Id,
                AssignedAt = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            var existingRoles = await _roleRepository.GetUserRoleNamesAsync(userId, cancellationToken);
            if (!existingRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
            {
                return;
            }

            if (existingRoles.Count <= 1)
            {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }

            await _roleRepository.RemoveUserRoleAsync(userId, role.Id, cancellationToken);
        }

        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateUserStatusAsync(long userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        if (!Enum.TryParse<UserStatus>(request.Status, ignoreCase: true, out var status))
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        user.Status = status.ToString();
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthUserResponse> CreateOwnerAsync(AdminCreateOwnerRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Password != request.ConfirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (await _userRepository.ExistsByPhoneAsync(request.Phone, cancellationToken))
        {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        var customerRole = await _roleRepository.GetByNameAsync(UserRoleType.Customer, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);
        var ownerRole = await _roleRepository.GetByNameAsync(UserRoleType.Owner, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);

        var user = new User
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            PasswordHash = _passwordHasherService.Hash(request.Password),
            Status = UserStatus.Active.ToString(),
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _roleRepository.AddUserRoleAsync(new UserRole
        {
            UserId = user.Id,
            RoleId = customerRole.Id,
            AssignedAt = DateTime.UtcNow
        }, cancellationToken);

        await _roleRepository.AddUserRoleAsync(new UserRole
        {
            UserId = user.Id,
            RoleId = ownerRole.Id,
            AssignedAt = DateTime.UtcNow
        }, cancellationToken);

        var nationalIdHash = !string.IsNullOrWhiteSpace(request.NationalId)
            ? HashNationalId(request.NationalId)
            : null;
        var nationalIdMasked = !string.IsNullOrWhiteSpace(request.NationalId)
            ? MaskNationalId(request.NationalId)
            : null;

        await _userRepository.AddCustomerProfileAsync(new CustomerProfile
        {
            UserId = user.Id,
            NationalId = request.NationalId,
            NationalIdHash = nationalIdHash,
            NationalIdMasked = nationalIdMasked,
            NationalIdVerified = request.NationalIdVerified
        }, cancellationToken);

        var application = new OwnerApplication
        {
            UserId = user.Id,
            Status = "Approved",
            BankName = request.BankName,
            BankAccountNumber = request.BankAccountNumber,
            BankAccountHolderName = request.BankAccountHolderName,
            SubmittedAt = DateTime.UtcNow,
            ApprovedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddOwnerApplicationAsync(application, cancellationToken);

        await _userRepository.AddOwnerProfileAsync(new OwnerProfile
        {
            UserId = user.Id,
            BankName = request.BankName,
            BankAccountNumber = request.BankAccountNumber,
            BankAccountHolderName = request.BankAccountHolderName,
            IsVerified = true,
            VerifiedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OwnerApplicationCreated, null, null, cancellationToken: cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OwnerApplicationSubmitted, null, null, cancellationToken: cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OwnerRoleAssigned, null, null, cancellationToken: cancellationToken);

        var response = _mapper.Map<AuthUserResponse>(user);
        response.Roles = [UserRoleType.Customer.ToString(), UserRoleType.Owner.ToString()];
        return response;
    }

    public async Task<AuthUserResponse> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Password != request.ConfirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            throw new AppException(ErrorCode.STAFF_EMAIL_EXISTED);
        }

        var role = await _roleRepository.GetByNameAsync(UserRoleType.Staff, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);

        var user = new User
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasherService.Hash(request.Password),
            Status = UserStatus.Active.ToString(),
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _roleRepository.AddUserRoleAsync(new UserRole
        {
            UserId = user.Id,
            RoleId = role.Id,
            AssignedAt = DateTime.UtcNow
        }, cancellationToken);

        await _userRepository.AddStaffProfileAsync(new StaffProfile
        {
            UserId = user.Id,
            EmployeeCode = request.EmployeeCode.Trim(),
            Department = request.Department
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.StaffCreated, null, null, cancellationToken: cancellationToken);

        var response = _mapper.Map<AuthUserResponse>(user);
        response.Roles = [UserRoleType.Staff.ToString()];
        return response;
    }

    private static string HashNationalId(string nationalId)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(nationalId));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string MaskNationalId(string nationalId)
    {
        if (string.IsNullOrWhiteSpace(nationalId))
        {
            return string.Empty;
        }

        if (nationalId.Length <= 4)
        {
            return new string('*', nationalId.Length);
        }

        return new string('*', nationalId.Length - 4) + nationalId[^4..];
    }
}
