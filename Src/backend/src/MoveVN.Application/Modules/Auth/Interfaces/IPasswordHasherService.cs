namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IPasswordHasherService
{
    string Hash(string value);
    bool Verify(string hash, string value);
    string Sha256(string value);
}
