using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.CmsPages.DTOs;

namespace MoveVN.Application.Modules.CmsPages.Interfaces;

public interface ICmsPageService
{
    Task<List<CmsPageNavigationItem>> GetNavigationAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<CmsPageResponse>> GetAllAsync(string? keyword, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<CmsPageResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<CmsPageResponse?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<CmsPageResponse> CreateAsync(CreateCmsPageRequest request, long userId, CancellationToken cancellationToken = default);
    Task<CmsPageResponse> UpdateAsync(int id, UpdateCmsPageRequest request, long userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
