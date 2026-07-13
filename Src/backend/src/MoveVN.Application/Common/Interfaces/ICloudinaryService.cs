namespace MoveVN.Application.Common.Interfaces;

public interface ICloudinaryService
{
    Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default);
    Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default);
    Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60);
    Task DeleteAsync(string publicId, CancellationToken cancellationToken = default);
}

public record CloudinaryUploadResult(string PublicId, string Url, int Width, int Height, long Bytes);
