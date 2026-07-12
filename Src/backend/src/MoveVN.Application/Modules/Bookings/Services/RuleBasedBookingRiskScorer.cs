using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;

namespace MoveVN.Application.Modules.Bookings.Services;

public class RuleBasedBookingRiskScorer : IBookingRiskScorer
{
    private const decimal BaseScore = 8m;

    public BookingRiskResult Calculate(BookingRiskContext context)
    {
        var identity = 0m;
        var newUser = 0m;
        var behavior = 0m;
        var ownerReview = 0m;
        var pattern = 0m;
        var valueDuration = 0m;
        var deposit = 0m;
        var factors = new List<string>();

        AddIdentityRisk(context, factors, ref identity);
        AddNewUserRisk(context, factors, ref newUser);
        AddBehaviorRisk(context, factors, ref behavior);
        AddOwnerReviewRisk(context, factors, ref ownerReview);
        AddBookingPatternRisk(context, factors, ref pattern);
        AddValueDurationRisk(context, factors, ref valueDuration);
        AddDepositRisk(context, factors, ref deposit);

        identity = Math.Clamp(identity, 0m, 35m);
        newUser = Math.Clamp(newUser, 0m, 22m);
        behavior = Math.Clamp(behavior, -15m, 35m);
        ownerReview = Math.Clamp(ownerReview, -10m, 25m);
        pattern = Math.Clamp(pattern, 0m, 25m);
        valueDuration = Math.Clamp(valueDuration, 0m, 25m);
        deposit = Math.Clamp(deposit, -5m, 10m);

        var score = Math.Clamp(
            BaseScore + identity + newUser + behavior + ownerReview + pattern + valueDuration + deposit,
            0m,
            100m);

        return new BookingRiskResult
        {
            Score = score,
            Level = score >= 61m ? "High" : score >= 31m ? "Medium" : "Low",
            Factors = factors,
        };
    }

    private static void AddIdentityRisk(BookingRiskContext context, List<string> factors, ref decimal identity)
    {
        if (!context.IsEmailVerified)
        {
            AddTo(ref identity, 10m, "Email chưa xác minh", factors);
        }

        if (!context.IsNationalIdVerified)
        {
            AddTo(ref identity, 20m, "CCCD chưa xác minh", factors);
        }

        if (!context.IsDriverLicenseVerified)
        {
            AddTo(ref identity, 15m, "Bằng lái chưa xác minh", factors);
        }
    }

    private static void AddNewUserRisk(BookingRiskContext context, List<string> factors, ref decimal newUser)
    {
        var accountAgeDays = (context.BookingCreatedAt - context.CustomerCreatedAt).TotalDays;

        if (context.CompletedTrips == 0)
        {
            if (accountAgeDays < 1)
            {
                AddTo(ref newUser, 10m, "Tài khoản dưới 1 ngày và chưa có chuyến hoàn tất", factors);
            }
            else if (accountAgeDays < 7)
            {
                AddTo(ref newUser, 7m, "Tài khoản dưới 7 ngày và chưa có chuyến hoàn tất", factors);
            }
            else if (accountAgeDays < 30)
            {
                AddTo(ref newUser, 4m, "Tài khoản dưới 30 ngày và chưa có chuyến hoàn tất", factors);
            }
        }

        if (context.TrustScore is null)
        {
            factors.Add("Chưa đủ dữ liệu trust score");
        }
    }

    private static void AddBehaviorRisk(BookingRiskContext context, List<string> factors, ref decimal behavior)
    {
        if (context.CancellationCount > 0)
        {
            AddTo(ref behavior, Math.Min(context.CancellationCount * 8m, 20m), $"Khách đã hủy {context.CancellationCount} booking", factors);
        }

        if (context.ReportCount > 0)
        {
            AddTo(ref behavior, Math.Min(context.ReportCount * 15m, 30m), $"Khách có {context.ReportCount} report", factors);
        }

        if (context.CompletedTrips >= 10)
        {
            AddTo(ref behavior, -15m, "Khách đã hoàn tất ít nhất 10 chuyến", factors);
        }
        else if (context.CompletedTrips >= 3)
        {
            AddTo(ref behavior, -8m, "Khách đã hoàn tất ít nhất 3 chuyến", factors);
        }

        if (context.TrustScore >= 80m)
        {
            AddTo(ref behavior, -6m, "Trust score cao", factors);
        }
        else if (context.TrustScore < 50m)
        {
            AddTo(ref behavior, 8m, "Trust score thấp", factors);
        }
    }

    private static void AddOwnerReviewRisk(BookingRiskContext context, List<string> factors, ref decimal ownerReview)
    {
        if (context.OwnerReviewCount == 0)
        {
            if (context.AverageRating.HasValue)
            {
                if (context.AverageRating >= 4.5m)
                {
                    AddTo(ref ownerReview, -3m, "Trust score ghi nhận đánh giá khách hàng tốt", factors);
                }
                else if (context.AverageRating < 3m)
                {
                    AddTo(ref ownerReview, 5m, "Trust score ghi nhận đánh giá khách hàng thấp", factors);
                }
            }

            factors.Add("Chưa đủ dữ liệu đánh giá từ chủ xe sau chuyến hoàn tất");
            return;
        }

        if (context.OwnerAverageRating >= 4.5m && context.OwnerReviewCount >= 3)
        {
            AddTo(ref ownerReview, -8m, $"Khách có {context.OwnerReviewCount} đánh giá tốt từ chủ xe", factors);
        }
        else if (context.OwnerAverageRating >= 4m && context.OwnerReviewCount >= 2)
        {
            AddTo(ref ownerReview, -4m, $"Khách có điểm đánh giá tốt từ chủ xe ({context.OwnerAverageRating:0.0}/5)", factors);
        }
        else if (context.OwnerAverageRating < 3m)
        {
            AddTo(ref ownerReview, 15m, $"Điểm đánh giá từ chủ xe thấp ({context.OwnerAverageRating:0.0}/5)", factors);
        }
        else if (context.OwnerAverageRating < 3.5m)
        {
            AddTo(ref ownerReview, 8m, $"Điểm đánh giá từ chủ xe cần lưu ý ({context.OwnerAverageRating:0.0}/5)", factors);
        }

        if (context.OwnerLowRatingCount >= 2)
        {
            AddTo(ref ownerReview, 6m, $"Có {context.OwnerLowRatingCount} đánh giá thấp từ chủ xe", factors);
        }

        if (context.OwnerRecentLowRatingCount90Days >= 1)
        {
            AddTo(ref ownerReview, 5m, "Có đánh giá thấp từ chủ xe trong 90 ngày gần đây", factors);
        }
    }

    private static void AddBookingPatternRisk(BookingRiskContext context, List<string> factors, ref decimal pattern)
    {
        var hoursUntilPickup = (context.StartDate - context.BookingCreatedAt).TotalHours;

        if (hoursUntilPickup < 0)
        {
            AddTo(ref pattern, 12m, "Thời gian nhận xe không hợp lệ", factors);
        }
        else if (hoursUntilPickup <= 24)
        {
            AddTo(ref pattern, 12m, "Nhận xe trong vòng 24 giờ", factors);
        }
        else if (hoursUntilPickup <= 72)
        {
            AddTo(ref pattern, 7m, "Nhận xe trong vòng 72 giờ", factors);
        }

        if (context.ActiveBookingCount >= 5)
        {
            AddTo(ref pattern, 15m, $"Khách có {context.ActiveBookingCount} booking đang hoạt động", factors);
        }
        else if (context.ActiveBookingCount >= 3)
        {
            AddTo(ref pattern, 8m, $"Khách có {context.ActiveBookingCount} booking đang hoạt động", factors);
        }

        if (context.RecentBookingCount7Days >= 5)
        {
            AddTo(ref pattern, 12m, $"Khách tạo {context.RecentBookingCount7Days} booking trong 7 ngày gần đây", factors);
        }
        else if (context.RecentBookingCount7Days >= 3)
        {
            AddTo(ref pattern, 6m, $"Khách tạo {context.RecentBookingCount7Days} booking trong 7 ngày gần đây", factors);
        }
    }

    private static void AddValueDurationRisk(BookingRiskContext context, List<string> factors, ref decimal valueDuration)
    {
        if (context.TotalAmount >= 10_000_000m)
        {
            AddTo(ref valueDuration, 15m, "Giá trị booking cao", factors);
        }
        else if (context.TotalAmount >= 5_000_000m)
        {
            AddTo(ref valueDuration, 8m, "Giá trị booking tương đối cao", factors);
        }

        if (context.TotalDays >= 30)
        {
            AddTo(ref valueDuration, 12m, "Thời gian thuê dài", factors);
        }
        else if (context.TotalDays >= 7)
        {
            AddTo(ref valueDuration, 7m, "Thời gian thuê từ 7 ngày", factors);
        }
    }

    private static void AddDepositRisk(BookingRiskContext context, List<string> factors, ref decimal deposit)
    {
        if (context.VehicleRequiresDeposit && context.DepositAmount <= 0m)
        {
            AddTo(ref deposit, 10m, "Xe yêu cầu cọc nhưng chưa có tiền cọc", factors);
        }
        else if (context.DepositAmount > 0m)
        {
            AddTo(ref deposit, -5m, "Đã có tiền cọc", factors);
        }
    }

    private static void AddTo(ref decimal bucket, decimal points, string factor, List<string> factors)
    {
        bucket += points;
        factors.Add(factor);
    }
}
