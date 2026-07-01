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
