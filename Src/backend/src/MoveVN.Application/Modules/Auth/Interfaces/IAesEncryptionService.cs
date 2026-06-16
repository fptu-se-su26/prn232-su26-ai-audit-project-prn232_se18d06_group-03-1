namespace MoveVN.Application.Modules.Auth.Interfaces;

/// <summary>
/// AES-256-GCM encryption for sensitive fields (CCCD, etc.).
/// Key is loaded from environment variable AES_KEY (base64, 32 bytes).
/// </summary>
public interface IAesEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}
