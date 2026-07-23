using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.UserManagementAuditLog.Interfaces;

namespace MoveVN.Api.Controllers.Staff;

[Authorize(Roles = "Staff")]
[Route("api/staff/users")]
public class StaffUsersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;
    private readonly IUserManagementAuditLogService _auditLog;
    private readonly ICurrentUserContext _currentUser;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private string? _cachedActorName;
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase) { "Owner", "Customer" };
    private static readonly HashSet<string> AllowedAssignRoles = new(StringComparer.OrdinalIgnoreCase) { "Owner", "Customer" };

    public StaffUsersController(
        IAdminUserService adminUserService,
        IUserManagementAuditLogService auditLog,
        ICurrentUserContext currentUser,
        IHttpContextAccessor httpContextAccessor)
    {
        _adminUserService = adminUserService;
        _auditLog = auditLog;
        _currentUser = currentUser;
        _httpContextAccessor = httpContextAccessor;
    }

    private string GetClientIp()
    {
        return _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "";
    }

    private async Task<string> GetActorNameAsync(CancellationToken ct)
    {
        if (_cachedActorName != null) return _cachedActorName;
        var actorId = _currentUser.UserId;
        if (actorId == null) return "Unknown";
        var actor = await _adminUserService.GetUserByIdAsync(actorId.Value, ct);
        _cachedActorName = actor?.FullName ?? "Unknown";
        return _cachedActorName;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserListItem>>>> GetUsers(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] bool? isOnline,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrEmpty(role) && !AllowedRoles.Contains(role))
        {
            return BadRequest(ApiResponse<PagedResult<AdminUserListItem>>.Failed("400", "Nhân viên chỉ có thể quản lý chủ xe và khách hàng."));
        }

        if (string.IsNullOrEmpty(role))
        {
            role = null;
        }

        var result = await _adminUserService.GetUsersAsync(keyword, sortBy, role, status, isOnline, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<AdminUserDetailDto>>> GetUserById(
        long id,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound(ApiResponse<AdminUserDetailDto>.Failed("404", "Không tìm thấy người dùng."));
        }

        var userRoles = result.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
        {
            return Forbid();
        }

        return Success(result);
    }

    [HttpGet("{id:long}/logs")]
    public async Task<ActionResult<ApiResponse<List<UserManagementAuditLogItem>>>> GetLogs(
        long id,
        CancellationToken cancellationToken = default)
    {
        var result = await _auditLog.GetByTargetUserIdAsync(id, 50, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUser(
        long id,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
            return NotFound(ApiResponse<object>.Failed("404", "Không tìm thấy người dùng."));

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
            return Forbid();

        var oldValue = System.Text.Json.JsonSerializer.Serialize(new { user.FullName, Phone = user.Phone });
        await _adminUserService.UpdateUserAsync(id, request, cancellationToken);
        var newValue = System.Text.Json.JsonSerializer.Serialize(new { request.FullName, request.Phone });

        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Staff",
            "UpdateInfo", id, user.FullName,
            oldValue, newValue, GetClientIp(), cancellationToken);

        return Success<object>(null, "Cập nhật thông tin người dùng thành công.");
    }

    [HttpPatch("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(
        long id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
            return NotFound(ApiResponse<object>.Failed("404", "Không tìm thấy người dùng."));

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
            return Forbid();

        var oldStatus = user.Status;
        await _adminUserService.UpdateUserStatusAsync(id, request, cancellationToken);

        var actionName = request.Status switch
        {
            "Suspended" => "SuspendUser",
            "Active" when oldStatus == "Suspended" => "ActivateUser",
            "Deleted" => "DeleteUser",
            "Active" when oldStatus == "Deleted" => "RestoreUser",
            _ => "ChangeStatus"
        };

        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Staff",
            actionName, id, user.FullName,
            oldStatus, request.Status, GetClientIp(), cancellationToken);

        return Success<object>(null, "Cập nhật trạng thái thành công.");
    }

    [HttpPatch("{id:long}/roles")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserRole(
        long id,
        UpdateUserRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!AllowedAssignRoles.Contains(request.Role))
        {
            return BadRequest(ApiResponse<object>.Failed("400", "Nhân viên chỉ có thể phân quyền Owner và Customer."));
        }

        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
            return NotFound(ApiResponse<object>.Failed("404", "Không tìm thấy người dùng."));

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
            return Forbid();

        await _adminUserService.UpdateUserRoleAsync(id, request, cancellationToken);

        var actionName = request.Assigned ? "AssignRole" : "RemoveRole";
        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Staff",
            actionName, id, user.FullName,
            null, request.Role, GetClientIp(), cancellationToken);

        return Success<object>(null, "Cập nhật vai trò thành công.");
    }

    [HttpPost("customers")]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> CreateCustomer(
        AdminCreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.CreateCustomerAsync(request, cancellationToken);

        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Staff",
            "CreateUser", result.UserId, result.FullName,
            null, "Customer", GetClientIp(), cancellationToken);

        return Success(result, "Tạo khách hàng thành công.");
    }

    [HttpPost("owners")]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> CreateOwner(
        [FromForm] StaffCreateOwnerForm request,
        CancellationToken cancellationToken)
    {
        var ownerRequest = new AdminCreateOwnerRequest
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Password = request.Password,
            ConfirmPassword = request.ConfirmPassword,
            UseOcr = request.UseOcr,
            NationalId = request.NationalId,
            DateOfBirth = request.DateOfBirth,
            Address = request.Address,
            NationalIdFrontImage = await ToDocumentAsync(request.NationalIdFrontImage, cancellationToken),
            DriverLicenseNumber = request.DriverLicenseNumber,
            DriverLicenseClass = request.DriverLicenseClass,
            DriverLicenseVehicleType = request.DriverLicenseVehicleType,
            DriverLicenseFrontImage = await ToDocumentAsync(request.DriverLicenseFrontImage, cancellationToken),
            BankName = request.BankName,
            BankAccountNumber = request.BankAccountNumber,
            BankAccountHolderName = request.BankAccountHolderName
        };

        var result = await _adminUserService.CreateOwnerAsync(ownerRequest, cancellationToken);

        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Staff",
            "CreateUser", result.UserId, result.FullName,
            null, "Owner", GetClientIp(), cancellationToken);

        return Success(result, "Tạo chủ xe thành công.");
    }

    private static async Task<AdminDocumentFile> ToDocumentAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null) return new AdminDocumentFile();
        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        return new AdminDocumentFile { FileName = file.FileName, Content = memory.ToArray() };
    }
}

public sealed class StaffCreateOwnerForm
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public bool UseOcr { get; set; }
    public string NationalId { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public IFormFile NationalIdFrontImage { get; set; } = null!;
    public string DriverLicenseNumber { get; set; } = string.Empty;
    public string DriverLicenseClass { get; set; } = string.Empty;
    public string DriverLicenseVehicleType { get; set; } = string.Empty;
    public IFormFile DriverLicenseFrontImage { get; set; } = null!;
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolderName { get; set; } = string.Empty;
}