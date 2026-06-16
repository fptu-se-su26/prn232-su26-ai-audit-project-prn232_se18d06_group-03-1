using System.Security.Cryptography;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class AesEncryptionService : IAesEncryptionService
{
    private readonly byte[] _key;

    public AesEncryptionService()
    {
        var keyBase64 = Environment.GetEnvironmentVariable("AES_KEY")
            ?? "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=";
        _key = Convert.FromBase64String(keyBase64);

        if (_key.Length != 32)
            throw new InvalidOperationException("AES key must be 32 bytes (256 bits).");
    }

    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;

        var nonce = RandomNumberGenerator.GetBytes(12);
        var plainBytes = System.Text.Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plainBytes.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(_key);
        aes.Encrypt(nonce, plainBytes, ciphertext, tag);

        var result = new byte[12 + 16 + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, 12);
        Buffer.BlockCopy(tag, 0, result, 12, 16);
        Buffer.BlockCopy(ciphertext, 0, result, 28, ciphertext.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return ciphertext;

        var data = Convert.FromBase64String(ciphertext);
        if (data.Length < 28)
            throw new InvalidOperationException("Invalid ciphertext.");

        var nonce = data[..12];
        var tag = data[12..28];
        var encrypted = data[28..];
        var plainBytes = new byte[encrypted.Length];

        using var aes = new AesGcm(_key);
        aes.Decrypt(nonce, encrypted, tag, plainBytes);

        return System.Text.Encoding.UTF8.GetString(plainBytes);
    }
}
