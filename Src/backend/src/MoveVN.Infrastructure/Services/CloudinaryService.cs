using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["CLOUDINARY_CLOUD_NAME"];
        var apiKey = configuration["CLOUDINARY_API_KEY"];
        var apiSecret = configuration["CLOUDINARY_API_SECRET"];

        if (string.IsNullOrWhiteSpace(cloudName) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
        {
            throw new InvalidOperationException("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<CloudinaryUploadResult> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = folder,
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false
        };

        var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);

        if (result.Error is not null)
        {
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED, [result.Error.Message]);
        }

        return new CloudinaryUploadResult(
            result.PublicId,
            result.SecureUrl.AbsoluteUri,
            result.Width,
            result.Height,
            result.Bytes);
    }

    public async Task<CloudinaryUploadResult> UploadWithPublicIdAsync(Stream fileStream, string fileName, string publicId, CancellationToken cancellationToken = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            PublicId = publicId,
            UseFilename = false,
            UniqueFilename = false,
            Overwrite = true
        };

        var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);

        if (result.Error is not null)
        {
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED, [result.Error.Message]);
        }

        return new CloudinaryUploadResult(
            result.PublicId,
            result.SecureUrl.AbsoluteUri,
            result.Width,
            result.Height,
            result.Bytes);
    }

    public Task<string> GetSignedUrlAsync(string publicId, int expiryMinutes = 60)
    {
        try
        {
            var url = _cloudinary.Api.UrlImgUp
                .ResourceType("image")
                .Signed(true)
                .BuildUrl(publicId);

            return Task.FromResult(url);
        }
        catch (Exception)
        {
            throw new AppException(ErrorCode.CLOUDINARY_SIGNED_URL_FAILED);
        }
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
    {
        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);

        if (result.Error is not null)
        {
            throw new AppException(ErrorCode.CLOUDINARY_DELETE_FAILED, [result.Error.Message]);
        }
    }
}
