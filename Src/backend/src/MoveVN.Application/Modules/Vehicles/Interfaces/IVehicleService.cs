using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IVehicleService
{
    /// <summary>Owner tạo xe mới, status = Pending.</summary>
    Task<VehicleResponse> CreateAsync(CreateVehicleRequest request, CancellationToken cancellationToken = default);

    /// <summary>Upload ảnh cho xe (multipart), trả về danh sách images mới.</summary>
    Task<List<VehicleImageDto>> UploadImagesAsync(long vehicleId, IList<Microsoft.AspNetCore.Http.IFormFile> files, CancellationToken cancellationToken = default);

    /// <summary>GET public - chỉ status=Available, có filter + phân trang.</summary>
    Task<PagedResult<VehicleResponse>> GetPublicListAsync(VehicleListRequest request, CancellationToken cancellationToken = default);

    /// <summary>GET /vehicles/{id} - public.</summary>
    Task<VehicleResponse> GetByIdPublicAsync(long vehicleId, CancellationToken cancellationToken = default);

    /// <summary>Staff approve / reject xe.</summary>
    Task ApproveAsync(long vehicleId, long staffId, ApproveVehicleRequest request, CancellationToken cancellationToken = default);

    /// <summary>Staff: danh sách xe Pending chờ duyệt.</summary>
    Task<PagedResult<VehicleResponse>> GetPendingQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
