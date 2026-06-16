using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace MoveVN.Application.Modules.Bookings.Services;

public class InspectionService : IInspectionService
{
    private readonly IInspectionRepository _repo;
    private readonly ICloudinaryService _cloudinary;

    public InspectionService(IInspectionRepository repo, ICloudinaryService cloudinary)
    {
        _repo = repo;
        _cloudinary = cloudinary;
    }

    public async Task<InspectionResponse> CreateAsync(CreateInspectionRequest request, long staffId,
        IList<IFormFile>? images, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetBookingAsync(request.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        var report = new InspectionReport
        {
            BookingId = request.BookingId,
            Type = request.Type,
            StaffId = staffId,
            OdometerKm = request.OdometerKm,
            FuelLevel = request.FuelLevel,
            DamageNoted = request.DamageNoted,
            DamageDescription = request.DamageDescription
        };

        await _repo.AddAsync(report, cancellationToken);

        // Upload ảnh
        var imageUrls = new List<string>();
        if (images is not null)
        {
            foreach (var file in images)
            {
                var url = await _cloudinary.UploadImageAsync(file, "inspections", cancellationToken);
                imageUrls.Add(url);
                await _repo.AddImageAsync(new CheckInOutImage
                {
                    BookingId = request.BookingId,
                    InspectionId = report.Id,
                    ImageUrl = url,
                    ImageType = request.Type,
                    UploadedBy = staffId
                }, cancellationToken);
            }
        }

        // Transition booking status
        if (request.Type == "CheckIn")
            booking.Status = "InProgress";
        else if (request.Type == "CheckOut")
            booking.Status = "Completed";

        booking.UpdatedAt = DateTime.UtcNow;
        _repo.UpdateBooking(booking);
        await _repo.SaveChangesAsync(cancellationToken);

        return new InspectionResponse
        {
            Id = report.Id,
            BookingId = report.BookingId,
            Type = report.Type,
            StaffId = report.StaffId,
            OdometerKm = report.OdometerKm,
            FuelLevel = report.FuelLevel,
            DamageNoted = report.DamageNoted,
            DamageDescription = report.DamageDescription,
            Images = imageUrls,
            CreatedAt = report.CreatedAt
        };
    }

    public async Task<InspectionResponse?> GetByBookingAndTypeAsync(long bookingId, string type, CancellationToken cancellationToken = default)
    {
        var report = await _repo.GetByBookingAndTypeAsync(bookingId, type, cancellationToken);
        if (report is null) return null;

        var images = await _repo.GetImagesAsync(report.Id, cancellationToken);
        return new InspectionResponse
        {
            Id = report.Id,
            BookingId = report.BookingId,
            Type = report.Type,
            StaffId = report.StaffId,
            OdometerKm = report.OdometerKm,
            FuelLevel = report.FuelLevel,
            DamageNoted = report.DamageNoted,
            DamageDescription = report.DamageDescription,
            ReportPdfUrl = report.ReportPdfUrl,
            Images = images,
            CreatedAt = report.CreatedAt
        };
    }
}
