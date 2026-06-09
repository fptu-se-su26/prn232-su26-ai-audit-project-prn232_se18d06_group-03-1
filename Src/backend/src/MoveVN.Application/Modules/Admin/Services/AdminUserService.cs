using AutoMapper;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AdminUserService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IPasswordHasherService passwordHasherService,
        IAuthActivityLogger activityLogger,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _passwordHasherService = passwordHasherService;
        _activityLogger = activityLogger;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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
}
