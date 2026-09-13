using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class AesEncryptionService : IEncryptionService
{
    private const string LegacyPrefix = "mvn1:";

    private readonly byte[] _key;

    public AesEncryptionService(IConfiguration configuration)
    {
        var secret = configuration["ENCRYPTION_KEY"]
            ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY");
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException(
                "ENCRYPTION_KEY is not configured. Add it to the backend .env file before storing OCR data.");
        }

        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public string? Encrypt(string? plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return plainText;
        }

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        var payload = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, payload, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, payload, aes.IV.Length, cipherBytes.Length);

        return LegacyPrefix + Convert.ToBase64String(payload);
    }

    public string? Decrypt(string? cipherTextBase64)
    {
        if (string.IsNullOrEmpty(cipherTextBase64))
        {
            return cipherTextBase64;
        }

        if (cipherTextBase64.StartsWith('"'))
        {
            try
            {
                cipherTextBase64 = JsonSerializer.Deserialize<string>(cipherTextBase64);
            }
            catch (JsonException)
            {
                return cipherTextBase64;
            }
        }

        if (string.IsNullOrEmpty(cipherTextBase64))
        {
            return cipherTextBase64;
        }

        if (!cipherTextBase64.StartsWith(LegacyPrefix, StringComparison.Ordinal))
        {
            return cipherTextBase64;
        }

        try
        {
            var payload = Convert.FromBase64String(cipherTextBase64[LegacyPrefix.Length..]);
            if (payload.Length < 17)
            {
                return null;
            }

            var iv = new byte[16];
            Buffer.BlockCopy(payload, 0, iv, 0, iv.Length);

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(payload, iv.Length, payload.Length - iv.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
        catch (Exception ex) when (ex is CryptographicException or FormatException or ArgumentException)
        {
            return null;
        }
    }
}