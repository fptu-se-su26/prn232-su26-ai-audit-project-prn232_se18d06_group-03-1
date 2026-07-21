using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.CmsPages.DTOs;
using MoveVN.Application.Modules.CmsPages.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.CmsPages.Services;

public class CmsPageService : ICmsPageService
{
    private readonly IVehicleCatalogRepository _repository;

    public CmsPageService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<CmsPageResponse>> GetAllAsync(string? keyword, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.CmsPages;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(kw) || x.Slug.ToLower().Contains(kw));
        }

        query = query.OrderByDescending(x => x.UpdatedAt);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await Project(query).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return new PagedResult<CmsPageResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<CmsPageResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var response = await Project(_repository.CmsPages.Where(x => x.Id == id)).FirstOrDefaultAsync(cancellationToken);
        return response ?? throw new AppException(ErrorCode.CMS_PAGE_NOT_FOUND);
    }

    public async Task<CmsPageResponse?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var normalizedSlug = slug.Trim().ToLower();
        return await Project(_repository.CmsPages.Where(x => x.Slug == normalizedSlug && x.IsActive)).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<CmsPageResponse> CreateAsync(CreateCmsPageRequest request, long userId, CancellationToken cancellationToken = default)
    {
        var slug = request.Slug.Trim().ToLower();
        var exists = await _repository.CmsPages.AnyAsync(x => x.Slug == slug, cancellationToken);
        if (exists)
            throw new AppException(ErrorCode.CMS_PAGE_DUPLICATED);

        var entity = new CmsPage
        {
            Slug = slug,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            Version = 1,
            IsActive = true,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<CmsPageResponse> UpdateAsync(int id, UpdateCmsPageRequest request, long userId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.CmsPages.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new AppException(ErrorCode.CMS_PAGE_NOT_FOUND);

        entity.Title = request.Title.Trim();
        entity.Content = request.Content.Trim();
        entity.IsActive = request.IsActive;
        entity.Version = entity.Version + 1;
        entity.UpdatedBy = userId;
        entity.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.CmsPages.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new AppException(ErrorCode.CMS_PAGE_NOT_FOUND);

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<CmsPageResponse> Project(IQueryable<CmsPage> query)
        => query.Select(x => new CmsPageResponse
        {
            Id = x.Id,
            Slug = x.Slug,
            Title = x.Title,
            Content = x.Content,
            Version = x.Version,
            IsActive = x.IsActive,
            UpdatedAt = x.UpdatedAt
        });
}
