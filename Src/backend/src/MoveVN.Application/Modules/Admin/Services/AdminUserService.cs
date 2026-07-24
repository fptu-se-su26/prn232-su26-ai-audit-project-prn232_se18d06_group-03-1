using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Mail;
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
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
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
    private readonly ICurrentUserContext _currentUserContext;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly INationalIdVerificationClient _nationalIdVerificationClient;
    private readonly IDriverLicenseVerificationClient _driverLicenseVerificationClient;
    private readonly ICustomerDriverLicenseRepository _customerDriverLicenseRepository;

    public AdminUserService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IPasswordHasherService passwordHasherService,
        IAuthActivityLogger activityLogger,
        IPresenceService presenceService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserContext currentUserContext,
        ICloudinaryService cloudinaryService,
        INationalIdVerificationClient nationalIdVerificationClient,
        IDriverLicenseVerificationClient driverLicenseVerificationClient,
        ICustomerDriverLicenseRepository customerDriverLicenseRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _passwordHasherService = passwordHasherService;
        _activityLogger = activityLogger;
        _presenceService = presenceService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _currentUserContext = currentUserContext;
        _cloudinaryService = cloudinaryService;
        _nationalIdVerificationClient = nationalIdVerificationClient;
        _driverLicenseVerificationClient = driverLicenseVerificationClient;
        _customerDriverLicenseRepository = customerDriverLicenseRepository;
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

        if (roleType == UserRoleType.Admin)
        {
            throw new AppException(ErrorCode.ADMIN_ROLE_IMMUTABLE);
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

    public async Task<AuthUserResponse> CreateCustomerAsync(AdminCreateCustomerRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureNewUserIsValidAsync(request.FullName, request.Email, request.Phone, request.Password, request.ConfirmPassword, cancellationToken);

        var customerRole = await _roleRepository.GetByNameAsync(UserRoleType.Customer, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);
        var user = BuildAdminCreatedUser(request.FullName, request.Email, request.Phone, request.Password);

        await _unitOfWork.ExecuteInTransactionAsync(async transactionToken =>
        {
            await _userRepository.AddAsync(user, transactionToken);
            await _unitOfWork.SaveChangesAsync(transactionToken);
            await _roleRepository.AddUserRoleAsync(new UserRole
            {
                UserId = user.Id,
                RoleId = customerRole.Id,
                AssignedAt = DateTime.UtcNow
            }, transactionToken);
            await _userRepository.AddCustomerProfileAsync(new CustomerProfile { UserId = user.Id }, transactionToken);
            await _unitOfWork.SaveChangesAsync(transactionToken);
        }, cancellationToken);

        var response = _mapper.Map<AuthUserResponse>(user);
        response.Roles = [UserRoleType.Customer.ToString()];
        return response;
    }

    public async Task<AdminOwnerOcrPreviewResponse> PreviewOwnerDocumentsAsync(
        AdminOwnerOcrPreviewRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.NationalIdFrontImage is null && request.DriverLicenseFrontImage is null)
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["Vui lòng chọn ít nhất một ảnh để đọc OCR."]);
        }

        ValidateOptionalDocument(request.NationalIdFrontImage, "ảnh CCCD");
        ValidateOptionalDocument(request.DriverLicenseFrontImage, "ảnh GPLX");

        var response = new AdminOwnerOcrPreviewResponse();
        if (request.NationalIdFrontImage is not null)
        {
            var result = await _nationalIdVerificationClient.PreVerifyAsync(
                request.NationalIdFrontImage.Content,
                request.NationalIdFrontImage.FileName,
                cancellationToken) ?? throw new AppException(ErrorCode.OWNER_VERIFICATION_REQUEST_FAILED);

            response.NationalId = new AdminNationalIdOcrPreview
            {
                Success = result.Success,
                NationalId = result.NationalId,
                FullName = result.FullName,
                DateOfBirth = result.DateOfBirth.HasValue ? DateOnly.FromDateTime(result.DateOfBirth.Value) : null,
                Address = result.Address,
                Confidence = (decimal)result.Confidence,
                Recommendation = result.Recommendation,
                Flags = result.Flags
            };
        }

        if (request.DriverLicenseFrontImage is not null)
        {
            using var stream = new MemoryStream(request.DriverLicenseFrontImage.Content);
            var result = await _driverLicenseVerificationClient.VerifyAsync(new DriverLicenseVerificationFileRequest
            {
                FileStream = stream,
                FileName = request.DriverLicenseFrontImage.FileName,
                FullName = request.FullName.Trim()
            }, cancellationToken);

            response.DriverLicense = new AdminDriverLicenseOcrPreview
            {
                Success = result.Valid,
                FullName = result.Extracted.FullName,
                DriverLicenseNumber = result.Extracted.DriverLicenseNumber,
                LicenseClass = result.Extracted.LicenseClass,
                Confidence = result.OcrConfidence,
                Recommendation = result.Recommendation,
                Flags = result.Flags
            };
        }

        return response;
    }

    public async Task<AuthUserResponse> CreateOwnerAsync(AdminCreateOwnerRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureNewUserIsValidAsync(request.FullName, request.Email, request.Phone, request.Password, request.ConfirmPassword, cancellationToken);
        ValidateOwnerData(request);
        ValidateDocument(request.NationalIdFrontImage, "ảnh mặt trước CCCD");
        ValidateDocument(request.DriverLicenseFrontImage, "ảnh GPLX");

        NationalIdPreVerifyResult? nationalOcrResult = null;
        DriverLicenseVerificationResult? driverLicenseOcrResult = null;
        if (request.UseOcr)
        {
            nationalOcrResult = await _nationalIdVerificationClient.PreVerifyAsync(
                request.NationalIdFrontImage.Content,
                request.NationalIdFrontImage.FileName,
                cancellationToken) ?? throw new AppException(ErrorCode.OWNER_VERIFICATION_REQUEST_FAILED);

            using var licenseStream = new MemoryStream(request.DriverLicenseFrontImage.Content);
            driverLicenseOcrResult = await _driverLicenseVerificationClient.VerifyAsync(new DriverLicenseVerificationFileRequest
            {
                FileStream = licenseStream,
                FileName = request.DriverLicenseFrontImage.FileName,
                FullName = request.FullName.Trim()
            }, cancellationToken);
        }

        // === Check duplicate CCCD before creating owner ===
        var nationalIdHash = HashNationalId(request.NationalId.Trim());
        var existingProfile = await _userRepository.GetByNationalIdHashAsync(nationalIdHash, cancellationToken);
        if (existingProfile != null)
        {
            var existingUser = await _userRepository.GetByIdAsync(existingProfile.UserId, cancellationToken);
            if (existingUser?.Status is not ("Deleted" or "Suspended"))
            {
                throw new AppException(ErrorCode.OWNER_NATIONAL_ID_DUPLICATED);
            }
        }

        var adminId = _currentUserContext.UserId ?? throw new AppException(ErrorCode.UNAUTHORIZED);
        var customerRole = await _roleRepository.GetByNameAsync(UserRoleType.Customer, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);
        var ownerRole = await _roleRepository.GetByNameAsync(UserRoleType.Owner, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);

        var user = BuildAdminCreatedUser(request.FullName, request.Email, request.Phone, request.Password);
        await _unitOfWork.ExecuteInTransactionAsync(async transactionToken =>
        {
            await _userRepository.AddAsync(user, transactionToken);
            await _unitOfWork.SaveChangesAsync(transactionToken);

            var folder = $"movevn/private/admin-created-owners/{user.Id}";
            var nationalFront = await UploadAsync(request.NationalIdFrontImage, $"{folder}/national-id/front", cancellationToken);
            var licenseFront = await UploadAsync(request.DriverLicenseFrontImage, $"{folder}/driver-license/front", cancellationToken);
            var now = DateTime.UtcNow;
            var provider = request.UseOcr ? "AI_CONFIRMED_BY_ADMIN" : "MANUAL_ADMIN";

            await _roleRepository.AddUserRoleAsync(new UserRole { UserId = user.Id, RoleId = customerRole.Id, AssignedAt = now }, cancellationToken);
            await _roleRepository.AddUserRoleAsync(new UserRole { UserId = user.Id, RoleId = ownerRole.Id, AssignedAt = now }, cancellationToken);

            var customerProfile = new CustomerProfile
            {
                UserId = user.Id,
                DateOfBirth = request.DateOfBirth,
                Address = request.Address?.Trim(),
                NationalId = request.NationalId.Trim(),
                NationalIdHash = HashNationalId(request.NationalId.Trim()),
                NationalIdMasked = MaskNationalId(request.NationalId.Trim()),
                NationalIdVerified = true,
                DriverLicenseVerified = true,
                PreferredVehicleType = request.DriverLicenseVehicleType
            };
            await _userRepository.AddCustomerProfileAsync(customerProfile, cancellationToken);

            var nationalVerification = new VerificationRequest
            {
                UserId = user.Id,
                Type = "NationalId",
                FrontImagePublicId = nationalFront.PublicId,
                FrontImageUrl = nationalFront.Url,
                Status = "Verified",
                ExternalProvider = provider,
                ExternalResultJson = nationalOcrResult?.RawResponse
                    ?? JsonSerializer.Serialize(new { method = provider, confirmedByAdmin = true }),
                Confidence = nationalOcrResult is null ? null : (decimal)nationalOcrResult.Confidence,
                DecisionReason = "Admin đã kiểm tra và xác nhận thông tin CCCD.",
                ProcessedAt = now,
                ReviewedBy = adminId,
                ReviewedAt = now,
                CreatedAt = now
            };
            await _userRepository.AddVerificationRequestAsync(nationalVerification, cancellationToken);

            var driverVerification = new VerificationRequest
            {
                UserId = user.Id,
                Type = "DriverLicense",
                RequestedVehicleType = request.DriverLicenseVehicleType,
                FrontImagePublicId = licenseFront.PublicId,
                FrontImageUrl = licenseFront.Url,
                Status = "Verified",
                ExternalProvider = provider,
                ExternalResultJson = driverLicenseOcrResult?.RawResponse
                    ?? JsonSerializer.Serialize(new
                    {
                        method = provider,
                        confirmedByAdmin = true,
                        extracted = new
                        {
                            driverLicenseNumber = request.DriverLicenseNumber.Trim(),
                            licenseClass = request.DriverLicenseClass.Trim()
                        }
                    }),
                Confidence = driverLicenseOcrResult?.OcrConfidence,
                DecisionReason = "Admin đã kiểm tra và xác nhận thông tin GPLX.",
                ProcessedAt = now,
                ReviewedBy = adminId,
                ReviewedAt = now,
                CreatedAt = now
            };
            await _userRepository.AddVerificationRequestAsync(driverVerification, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _customerDriverLicenseRepository.AddAsync(new CustomerDriverLicense
            {
                UserId = user.Id,
                VehicleType = request.DriverLicenseVehicleType,
                LicenseNumber = request.DriverLicenseNumber.Trim(),
                LicenseClass = request.DriverLicenseClass.Trim(),
                FrontImageUrl = licenseFront.Url,
                FrontImagePublicId = licenseFront.PublicId,
                VerificationRequestId = driverVerification.Id,
                OcrConfidence = driverLicenseOcrResult?.OcrConfidence,
                VerifiedAt = now,
                CreatedAt = now
            }, cancellationToken);

            var application = new OwnerApplication
            {
                UserId = user.Id,
                Status = "Approved",
                NationalIdVerificationRequestId = nationalVerification.Id,
                BankName = request.BankName.Trim(),
                BankAccountNumber = request.BankAccountNumber.Trim(),
                BankAccountHolderName = request.BankAccountHolderName.Trim(),
                SubmittedAt = now,
                ApprovedAt = now,
                ApprovedBy = adminId,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _userRepository.AddOwnerApplicationAsync(application, cancellationToken);
            await _userRepository.AddOwnerProfileAsync(new OwnerProfile
            {
                UserId = user.Id,
                BankName = request.BankName.Trim(),
                BankAccountNumber = request.BankAccountNumber.Trim(),
                BankAccountHolderName = request.BankAccountHolderName.Trim(),
                IsVerified = true,
                VerifiedAt = now
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(transactionToken);
        }, cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.NationalIdVerified, null, null, cancellationToken: cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OwnerApplicationCreated, null, null, cancellationToken: cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OwnerApplicationApproved, null, null, cancellationToken: cancellationToken);
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

    private async Task EnsureNewUserIsValidAsync(
        string fullName,
        string email,
        string phone,
        string password,
        string confirmPassword,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(fullName)
            || string.IsNullOrWhiteSpace(email)
            || !MailAddress.TryCreate(email.Trim(), out _)
            || string.IsNullOrWhiteSpace(phone)
            || string.IsNullOrWhiteSpace(password)
            || password.Length < 8)
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["Họ tên, email, số điện thoại và mật khẩu tối thiểu 8 ký tự là bắt buộc."]);
        }

        if (password != confirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (await _userRepository.ExistsByEmailAsync(email, cancellationToken))
        {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (await _userRepository.ExistsByPhoneAsync(phone, cancellationToken))
        {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
    }

    private static void ValidateOwnerData(AdminCreateOwnerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NationalId)
            || string.IsNullOrWhiteSpace(request.DriverLicenseNumber)
            || string.IsNullOrWhiteSpace(request.DriverLicenseClass)
            || request.DriverLicenseVehicleType is not ("Car" or "Motorbike")
            || string.IsNullOrWhiteSpace(request.BankName)
            || string.IsNullOrWhiteSpace(request.BankAccountNumber)
            || string.IsNullOrWhiteSpace(request.BankAccountHolderName))
        {
            throw new AppException(ErrorCode.VALIDATION_ERROR, ["Thông tin CCCD, GPLX và ngân hàng của chủ xe phải được nhập đầy đủ."]);
        }
    }

    private User BuildAdminCreatedUser(string fullName, string email, string phone, string password)
    {
        return new User
        {
            Email = email.Trim().ToLowerInvariant(),
            FullName = fullName.Trim(),
            Phone = phone.Trim(),
            PasswordHash = _passwordHasherService.Hash(password),
            Status = UserStatus.Active.ToString(),
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static void ValidateOptionalDocument(AdminDocumentFile? document, string displayName)
    {
        if (document is not null)
        {
            ValidateDocument(document, displayName);
        }
    }

    private static void ValidateDocument(AdminDocumentFile document, string displayName)
    {
        const int maxSize = 5 * 1024 * 1024;
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(document.FileName);

        if (document.Content.Length == 0 || document.Content.Length > maxSize || !allowedExtensions.Contains(extension))
        {
            throw new AppException(ErrorCode.OWNER_FILE_INVALID, [$"{displayName} chỉ chấp nhận JPG, PNG hoặc WebP và tối đa 5MB."]);
        }
    }

    private async Task<CloudinaryUploadResult> UploadAsync(
        AdminDocumentFile document,
        string publicId,
        CancellationToken cancellationToken)
    {
        using var stream = new MemoryStream(document.Content);
        return await _cloudinaryService.UploadWithPublicIdAsync(stream, document.FileName, publicId, cancellationToken);
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
