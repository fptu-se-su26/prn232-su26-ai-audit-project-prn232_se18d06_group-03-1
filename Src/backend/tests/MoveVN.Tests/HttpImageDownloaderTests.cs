using FluentAssertions;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Infrastructure.Services;

namespace MoveVN.Tests;

public class HttpImageDownloaderTests
{
    private sealed class FakeFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
    }

    [Fact]
    public async Task UnreachableHost_ThrowsAppException_NotRaw500()
    {
        var downloader = new HttpImageDownloader(new FakeFactory());

        var act = () => downloader.DownloadAsync("http://127.0.0.1:9/nope.jpg");

        (await Assert.ThrowsAsync<AppException>(act)).ErrorCode.Should().Be(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    [Fact]
    public async Task MalformedUrl_ThrowsAppException_NotRaw500()
    {
        var downloader = new HttpImageDownloader(new FakeFactory());

        var act = () => downloader.DownloadAsync("not-a-url");

        (await Assert.ThrowsAsync<AppException>(act)).ErrorCode.Should().Be(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
