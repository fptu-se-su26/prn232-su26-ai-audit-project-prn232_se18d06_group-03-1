using System.Text.Json;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Application.Common.Encryption;

public static class FieldProtector
{
    public static string? ToStoredJson(IEncryptionService encryption, string? plainJson)
    {
        if (string.IsNullOrEmpty(plainJson))
        {
            return null;
        }

        var cipher = encryption.Encrypt(plainJson);
        return string.IsNullOrEmpty(cipher) ? null : JsonSerializer.Serialize(cipher);
    }

    public static string? FromStoredJson(IEncryptionService encryption, string? storedValue)
    {
        return encryption.Decrypt(storedValue);
    }
}