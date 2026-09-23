using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class HttpImageDownloader : IImageDownloader
{
    private readonly IHttpClientFactory _httpClientFactory;

    public HttpImageDownloader(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<byte[]> DownloadAsync(string url, CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(60);
            return await client.GetByteArrayAsync(url, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, [$"Không tải được ảnh để chạy OCR ({ex.GetType().Name})."]);
        }
    }
}
