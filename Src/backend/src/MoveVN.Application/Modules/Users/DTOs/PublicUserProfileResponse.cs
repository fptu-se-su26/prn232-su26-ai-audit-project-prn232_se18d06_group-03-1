namespace MoveVN.Application.Modules.Users.DTOs;

public class PublicUserProfileResponse
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }

    public bool IsOwner { get; set; }
    public bool IsVerified { get; set; }
    public string? Tier { get; set; }
    public int TotalTrips { get; set; }
    public decimal? AverageRating { get; set; }

    public int TotalReviews { get; set; }
    public int TotalVehicles { get; set; }

    public List<PublicProfileVehicle> Vehicles { get; set; } = [];
    public List<PublicProfileReview> Reviews { get; set; } = [];
}

public class PublicProfileVehicle
{
    public long Id { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public decimal PricePerDay { get; set; }
    public string? PrimaryImage { get; set; }
    public string Address { get; set; } = string.Empty;
}

public class PublicProfileReview
{
    public long Id { get; set; }
    public long ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string? ReviewerAvatar { get; set; }
    public byte Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
