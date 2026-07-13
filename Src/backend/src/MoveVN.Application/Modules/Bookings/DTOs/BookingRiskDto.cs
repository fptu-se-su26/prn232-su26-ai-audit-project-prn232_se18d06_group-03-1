namespace MoveVN.Application.Modules.Bookings.DTOs;

public class BookingRiskContext
{
    public long CustomerId { get; set; }
    public DateTime CustomerCreatedAt { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsNationalIdVerified { get; set; }
    public bool IsDriverLicenseVerified { get; set; }
    public decimal? TrustScore { get; set; }
    public int CompletedTrips { get; set; }
    public int CancellationCount { get; set; }
    public int ReportCount { get; set; }
    public decimal? AverageRating { get; set; }
    public int OwnerReviewCount { get; set; }
    public decimal? OwnerAverageRating { get; set; }
    public int OwnerLowRatingCount { get; set; }
    public int OwnerRecentLowRatingCount90Days { get; set; }
    public int ActiveBookingCount { get; set; }
    public int RecentBookingCount7Days { get; set; }
    public DateTime BookingCreatedAt { get; set; }
    public DateTime StartDate { get; set; }
    public int TotalDays { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositAmount { get; set; }
    public bool VehicleRequiresDeposit { get; set; }
}

public class BookingRiskResult
{
    public decimal Score { get; set; }
    public string Level { get; set; } = "Low";
    public List<string> Factors { get; set; } = new();
}

public class BookingCustomerReviewStats
{
    public int OwnerReviewCount { get; set; }
    public decimal? OwnerAverageRating { get; set; }
    public int OwnerLowRatingCount { get; set; }
    public int OwnerRecentLowRatingCount90Days { get; set; }
}
