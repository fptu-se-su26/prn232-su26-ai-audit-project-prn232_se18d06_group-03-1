using Microsoft.AspNetCore.Http;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface ICloudinaryService
{
    Task<string> UploadImageAsync(IFormFile file, string folder, CancellationToken cancellationToken = default);
    Task<string> UploadFileAsync(IFormFile file, string folder, CancellationToken cancellationToken = default);
    Task DeleteAsync(string publicId, CancellationToken cancellationToken = default);
}
