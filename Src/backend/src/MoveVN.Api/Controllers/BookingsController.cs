using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/bookings")]
public class BookingsController : BaseApiController
{
    private readonly IBookingService _bookingService;
    private readonly ICurrentUserContext _currentUser;

    public BookingsController(IBookingService bookingService, ICurrentUserContext currentUser)
    {
        _bookingService = bookingService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Create(
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.CreateAsync(request, customerId, cancellationToken);
        return Success(result, "Tạo booking thành công.");
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] BookingListRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var (items, totalCount) = await _bookingService.GetMyBookingsAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(new { items, totalCount, page = request.Page, pageSize = request.PageSize }));
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("{id:long}/check-in")]
    public async Task<ActionResult<ApiResponse<InspectionReportResponse>>> CreateCheckInReport(
        long id,
        [FromForm] int? odometerKm,
        [FromForm] string? fuelLevel,
        [FromForm] bool damageNoted,
        [FromForm] string? damageDescription,
        [FromForm] List<IFormFile> images,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateInspectionImages(images);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<InspectionReportResponse>.Failed("BOOKING_CHECKIN_9001", validationError));
        }

        var streams = new List<Stream>();
        try
        {
            foreach (var image in images)
            {
                streams.Add(image.OpenReadStream());
            }

            var request = new CreateInspectionReportRequest
            {
                OdometerKm = odometerKm,
                FuelLevel = fuelLevel,
                DamageNoted = damageNoted,
                DamageDescription = damageDescription,
                Images = images.Select((image, index) => new InspectionImageUpload
                {
                    Content = streams[index],
                    FileName = image.FileName,
                }).ToList(),
            };

            var ownerId = _currentUser.UserId!.Value;
            var result = await _bookingService.CreateCheckInReportAsync(id, ownerId, request, cancellationToken);
            return Success(result, "Đã tạo biên bản check-in.");
        }
        finally
        {
            foreach (var stream in streams)
            {
                await stream.DisposeAsync();
            }
        }
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("{id:long}/check-out")]
    public async Task<ActionResult<ApiResponse<InspectionReportResponse>>> CreateCheckOutReport(
        long id,
        [FromForm] int? odometerKm,
        [FromForm] string? fuelLevel,
        [FromForm] bool damageNoted,
        [FromForm] string? damageDescription,
        [FromForm] List<IFormFile> images,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateInspectionImages(images);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<InspectionReportResponse>.Failed("BOOKING_CHECKOUT_9001", validationError));
        }

        var streams = new List<Stream>();
        try
        {
            foreach (var image in images)
            {
                streams.Add(image.OpenReadStream());
            }

            var request = new CreateInspectionReportRequest
            {
                OdometerKm = odometerKm,
                FuelLevel = fuelLevel,
                DamageNoted = damageNoted,
                DamageDescription = damageDescription,
                Images = images.Select((image, index) => new InspectionImageUpload
                {
                    Content = streams[index],
                    FileName = image.FileName,
                }).ToList(),
            };

            var ownerId = _currentUser.UserId!.Value;
            var result = await _bookingService.CreateCheckOutReportAsync(id, ownerId, request, cancellationToken);
            return Success(result, "Da tao bien ban check-out.");
        }
        finally
        {
            foreach (var stream in streams)
            {
                await stream.DisposeAsync();
            }
        }
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("{id:long}/check-in/confirm")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> ConfirmCheckIn(long id, CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.ConfirmCheckInAsync(id, customerId, cancellationToken);
        return Success(result, "Đã xác nhận nhận xe.");
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("{id:long}/check-out/confirm")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> ConfirmCheckOut(long id, CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.ConfirmCheckOutAsync(id, customerId, cancellationToken);
        return Success(result, "Da xac nhan tra xe.");
    }

    [HttpGet("{id:long}/inspection-reports")]
    public async Task<ActionResult<ApiResponse<List<InspectionReportResponse>>>> GetInspectionReports(
        long id,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var result = await _bookingService.GetInspectionReportsAsync(id, userId, IsStaffOrAdmin(), cancellationToken);
        return Success(result);
    }

    [Authorize(Roles = "Owner")]
    [HttpGet("owner")]
    public async Task<IActionResult> GetOwnerBookings(
        [FromQuery] BookingListRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var (items, totalCount) = await _bookingService.GetOwnerBookingsAsync(ownerId, request, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(new { items, totalCount, page = request.Page, pageSize = request.PageSize }));
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _bookingService.ApproveAsync(id, ownerId, cancellationToken);
        return Success(result, "Đã duyệt booking.");
    }

    [Authorize(Roles = "Customer")]
    [HttpPut("{id:long}/confirm-deposit")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> ConfirmDeposit(long id, CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.ConfirmDepositAsync(id, customerId, cancellationToken);
        return Success(result, "Xac nhan coc thanh cong.");
    }

    [Authorize(Roles = "Customer")]
    [HttpPut("{id:long}/complete")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Complete(long id, CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.CompleteAsync(id, customerId, cancellationToken);
        return Success(result, "Da hoan tat booking.");
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Reject(
        long id,
        RejectBookingRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _bookingService.RejectAsync(id, ownerId, request, cancellationToken);
        return Success(result, "Đã từ chối booking.");
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/owner-complete")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> OwnerComplete(
        long id,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _bookingService.OwnerCompleteAsync(id, ownerId, cancellationToken);
        return Success(result, "Da hoan thanh booking.");
    }

    private bool IsStaffOrAdmin()
        => User.IsInRole("Staff") || User.IsInRole("Admin");

    private static string? ValidateInspectionImages(List<IFormFile>? images)
    {
        if (images is null || images.Count == 0)
        {
            return "Cần tải lên ít nhất 1 ảnh check-in.";
        }

        if (images.Count > 12)
        {
            return "Chỉ được tải tối đa 12 ảnh check-in.";
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        const int maxSize = 5 * 1024 * 1024;

        foreach (var image in images)
        {
            if (image.Length == 0)
            {
                return "Ảnh check-in không được rỗng.";
            }

            if (image.Length > maxSize)
            {
                return "Mỗi ảnh check-in phải dưới 5MB.";
            }

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.";
            }
        }

        return null;
    }
}
