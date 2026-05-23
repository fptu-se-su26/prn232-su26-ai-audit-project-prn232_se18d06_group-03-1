namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface ICurrentUserContext
{
    Guid? UserId { get; }
}
