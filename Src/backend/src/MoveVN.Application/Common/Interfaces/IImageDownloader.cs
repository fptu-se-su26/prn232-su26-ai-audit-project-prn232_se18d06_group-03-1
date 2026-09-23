namespace MoveVN.Application.Common.Interfaces;

/// <summary>
/// Downloads remote images (e.g. stored verification photos) for diagnosis.
/// </summary>
public interface IImageDownloader
{
    Task<byte[]> DownloadAsync(string url, CancellationToken cancellationToken = default);
}
