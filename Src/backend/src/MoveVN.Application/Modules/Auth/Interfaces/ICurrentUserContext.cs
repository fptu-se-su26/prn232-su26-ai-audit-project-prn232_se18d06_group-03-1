namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface ICurrentUserContext
{
    Guid? UserId { get; }
    long? DomainUserId { get; }
    string? Email { get; }
    IList<string> Roles { get; }
}
