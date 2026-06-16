using MoveVN.Application.Modules.System.DTOs;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface IDashboardRepository
{
    Task<DashboardKpiDto> GetAdminKpiAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<List<DailyBookingDto>> GetOwnerRevenueAsync(long ownerId, int year, int month, CancellationToken cancellationToken = default);
}
