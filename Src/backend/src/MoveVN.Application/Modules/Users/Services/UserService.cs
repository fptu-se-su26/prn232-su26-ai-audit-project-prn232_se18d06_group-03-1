using AutoMapper;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;

namespace MoveVN.Application.Modules.Users.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UserService(
        IUserRepository userRepository,
        ICurrentUserContext currentUserContext,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _currentUserContext = currentUserContext;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<UserResponse> GetByIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        return _mapper.Map<UserResponse>(user);
    }

    public async Task<UserResponse> GetCurrentProfileAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return await GetByIdAsync(userId, cancellationToken);
    }

    public async Task<UserResponse> UpdateCurrentProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        user.FullName = request.FullName.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<UserResponse>(user);
    }
}
