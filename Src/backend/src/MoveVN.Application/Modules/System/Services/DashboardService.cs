using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;

namespace MoveVN.Application.Modules.System.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repo;

    public DashboardService(IDashboardRepository repo)
    {
        _repo = repo;
    }

    public async Task<DashboardKpiDto> GetAdminKpiAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        return await _repo.GetAdminKpiAsync(year, month, cancellationToken);
    }

    public async Task<List<DailyBookingDto>> GetOwnerRevenueAsync(long ownerId, int year, int month, CancellationToken cancellationToken = default)
    {
        return await _repo.GetOwnerRevenueAsync(ownerId, year, month, cancellationToken);
    }
}
