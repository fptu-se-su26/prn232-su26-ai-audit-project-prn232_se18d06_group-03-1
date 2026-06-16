using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary? _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(ILogger<CloudinaryService> logger)
    {
        _logger = logger;

        var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
        var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
        var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

        if (!string.IsNullOrEmpty(cloudName) && !string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(apiSecret))
        {
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }
        else
        {
            _logger.LogWarning("Cloudinary not configured. Will return mock URLs.");
        }
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder, CancellationToken cancellationToken = default)
    {
        if (_cloudinary == null)
            return $"https://mock.cloudinary.com/{folder}/{file.FileName}";

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);
        return result.SecureUrl?.AbsoluteUri ?? result.Url?.AbsoluteUri ?? string.Empty;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folder, CancellationToken cancellationToken = default)
    {
        if (_cloudinary == null)
            return $"https://mock.cloudinary.com/{folder}/{file.FileName}";

        using var stream = file.OpenReadStream();
        var uploadParams = new RawUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        return result.SecureUrl?.AbsoluteUri ?? result.Url?.AbsoluteUri ?? string.Empty;
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
    {
        if (_cloudinary == null)
        {
            _logger.LogWarning("Cloudinary not configured. Skipping delete for {PublicId}.", publicId);
            return;
        }

        var deleteParams = new DeletionParams(publicId);
        await _cloudinary.DestroyAsync(deleteParams);
    }
}
