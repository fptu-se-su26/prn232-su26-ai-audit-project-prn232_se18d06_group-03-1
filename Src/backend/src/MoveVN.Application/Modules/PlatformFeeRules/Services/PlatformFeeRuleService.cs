using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.PlatformFeeRules.DTOs;
using MoveVN.Application.Modules.PlatformFeeRules.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.PlatformFeeRules.Services;

public class PlatformFeeRuleService : IPlatformFeeRuleService
{
    private readonly IVehicleCatalogRepository _repository;
    private static readonly string[] GlobalTargetTypes = ["All", "Global"];

    public PlatformFeeRuleService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<PlatformFeeRuleResponse>> GetAllAsync(string? keyword, string? targetType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.PlatformFeeRules;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(kw));
        }

        if (!string.IsNullOrWhiteSpace(targetType))
        {
            var normalizedTargetType = NormalizeTargetType(targetType);
            query = IsGlobalTargetType(normalizedTargetType)
                ? query.Where(x => GlobalTargetTypes.Contains(x.TargetType))
                : query.Where(x => x.TargetType == normalizedTargetType);
        }

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        query = query.OrderBy(x => x.Priority).ThenBy(x => x.Id);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new PlatformFeeRuleResponse
            {
                Id = x.Id,
                Name = x.Name,
                TargetType = x.TargetType,
                TargetId = x.TargetId,
                FeeType = x.FeeType,
                FeeValue = x.FeeValue,
                MinFee = x.MinFee,
                MaxFee = x.MaxFee,
                Priority = x.Priority,
                StartAt = x.StartAt,
                EndAt = x.EndAt,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PlatformFeeRuleResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<PlatformFeeRuleResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPlatformFeeRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PLATFORM_FEE_RULE_NOT_FOUND);

        return ToResponse(entity);
    }

    public async Task<PlatformFeeRuleResponse> CreateAsync(CreatePlatformFeeRuleRequest request, CancellationToken cancellationToken = default)
    {
        var entity = new PlatformFeeRule
        {
            Name = request.Name,
            TargetType = NormalizeTargetType(request.TargetType),
            TargetId = IsGlobalTargetType(request.TargetType) ? null : request.TargetId,
            FeeType = request.FeeType,
            FeeValue = request.FeeValue,
            MinFee = request.MinFee,
            MaxFee = request.MaxFee,
            Priority = request.Priority,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<PlatformFeeRuleResponse> UpdateAsync(long id, UpdatePlatformFeeRuleRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPlatformFeeRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PLATFORM_FEE_RULE_NOT_FOUND);

        entity.Name = request.Name;
        entity.TargetType = NormalizeTargetType(request.TargetType);
        entity.TargetId = IsGlobalTargetType(request.TargetType) ? null : request.TargetId;
        entity.FeeType = request.FeeType;
        entity.FeeValue = request.FeeValue;
        entity.MinFee = request.MinFee;
        entity.MaxFee = request.MaxFee;
        entity.Priority = request.Priority;
        entity.StartAt = request.StartAt;
        entity.EndAt = request.EndAt;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPlatformFeeRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PLATFORM_FEE_RULE_NOT_FOUND);

        _repository.Remove(entity);
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private static PlatformFeeRuleResponse ToResponse(PlatformFeeRule entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        TargetType = entity.TargetType,
        TargetId = entity.TargetId,
        FeeType = entity.FeeType,
        FeeValue = entity.FeeValue,
        MinFee = entity.MinFee,
        MaxFee = entity.MaxFee,
        Priority = entity.Priority,
        StartAt = entity.StartAt,
        EndAt = entity.EndAt,
        IsActive = entity.IsActive,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
    };

    private static string NormalizeTargetType(string targetType)
    {
        return IsGlobalTargetType(targetType) ? "All" : targetType.Trim();
    }

    private static bool IsGlobalTargetType(string targetType)
    {
        return GlobalTargetTypes.Contains(targetType.Trim(), StringComparer.OrdinalIgnoreCase);
    }
}
