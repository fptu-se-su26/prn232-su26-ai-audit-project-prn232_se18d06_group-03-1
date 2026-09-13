namespace MoveVN.Application.Common.Interfaces;

public interface IEncryptionService
{
    string? Encrypt(string? plainText);

    string? Decrypt(string? cipherTextBase64);
}