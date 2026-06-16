namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class CreateVehicleRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public int ModelId { get; set; }
    public short Year { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal PricePerDay { get; set; }

    // Optional car details
    public int? SeatCount { get; set; }
    public string? Transmission { get; set; }
    public string? FuelType { get; set; }
    public string? BodyType { get; set; }
}

public class VehicleResponse
{
    public long Id { get; set; }
    public long OwnerId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public string? BrandName { get; set; }
    public int ModelId { get; set; }
    public string? ModelName { get; set; }
    public short Year { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public List<VehicleImageDto> Images { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class VehicleImageDto
{
    public long Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public byte SortOrder { get; set; }
}

public class VehicleListRequest
{
    public string? Keyword { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? VehicleType { get; set; }
    public string? Address { get; set; }
    public int? SeatCount { get; set; }
    public string? FuelType { get; set; }
    public string? SortBy { get; set; } // price_asc | price_desc | rating_desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class ApproveVehicleRequest
{
    public bool Approve { get; set; }
    public string? Reason { get; set; }
}
