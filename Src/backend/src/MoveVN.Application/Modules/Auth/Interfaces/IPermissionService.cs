namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IPermissionService
{
    Task<IList<string>> GetPermissionsAsync(long userId, CancellationToken cancellationToken = default);
    Task<bool> HasPermissionAsync(long userId, string permissionCode, CancellationToken cancellationToken = default);
}
